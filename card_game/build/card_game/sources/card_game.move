// This is the currently implemented contract
// Transfers game between players on each turn
// Player's turn is determined by who owns the object

#[allow(unused_variable, unused_use)]
module card_game::card_game {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::tx_context::{TxContext, Self};
    use sui::event;
    use std::vector;
    use sui::groth16;
    use std::debug;
    
    // CONSTANTS
    const STARTING_HEALTH: u64 = 1;
    const STARTING_DECK_SIZE: u64 = 4;
    const STARTING_HAND_SIZE: u64 = 6;

    // ERRORS
    const ESame_Player: u64 = 0;
    const EInvalid_Proof: u64 = 1;
    const EInvalid_VRF: u64 = 2;
    const EInvalid_Hand_Size: u64 = 3;
    const EAttackersNotSelectedCorrectly: u64 = 9;
    const EDefendersNotSelectedCorrectly: u64 = 5;
    const ETooManyDefendingCharacters: u64 = 7;
    const EInvalid_Deck_Size: u64 = 8;
    const EInvalid_State: u64 = 15;
    const EInvalidVectorDeletion: u64 = 16;

    // STATES
    const IS_WAITING_FOR_DRAW: u64 = 10;
    const IS_WAITING_FOR_DISCARD: u64 = 11; 
    const IS_WAITING_FOR_PLAY: u64 = 12;
    const IS_WAITING_FOR_ATTACK: u64 = 13;
    
    struct Game has key, store{
        id: UID,
        player_1: Player,
        player_2: Player,
        state: u64,
    }

    struct Player has key, store{
        id: UID,
        addr: address,
        deck_commitment: vector<u8>,
        deck_size: u64,
        hand_commitment: vector<u8>,
        hand_size: u64,
        graveyard: vector<Card>,
        board: vector<Card>,
        life: u64,
        played_character_this_turn: bool,
    }

    /*  

    Person gets an nft card, 
    when game starts, their deck is composed of private nfts

    // only the owner of the private card can see the contents
    struct PrivateCard has key, store{ 
        id: UID,
        name: vector<u8>,
        description: vector<u8>,
        type: vector<u8>,
        image_url: vector<u8>,
    }
    */

    

    struct Card has key, store{
        id: UID,
        name: String,
        description: String,
        // TODO: Add spells as type as well(potions/buffs/etc)
        type: Character,
        image_url: Url,
    }

    struct Character has store {
        attack: u64,
        defense: u64,   
        // game_attack: u64, TODO: Add game_attack and game_defense so we players can get their card back when game ends
        // game_defense: u64,
    }

    struct Challenge has key {
        id: UID,
        challenger: address,
        opponent: address,
    }

    struct ChallengeAccepted has copy, drop {
        id: ID,
        challenger: address,
        accepter: address
    }

    struct TurnEnded has copy, drop{
        player: address,
    }

    struct GameOver has copy, drop {
        id: ID,
        winner: address
    }

    struct VerifiedEvent has copy, drop {
        is_verified: bool,
    }   


    // mint function
    public fun get_new_character(
        name: vector<u8>, 
        description: vector<u8>, 
        image_url: vector<u8>, 
        attack: u64,
        defense: u64,
        ctx: &mut TxContext){
        transfer::transfer(
            Card{
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            type: Character{
                attack: attack,
                defense: defense,
            },
            image_url: url::new_unsafe_from_bytes(image_url),
        }, tx_context::sender(ctx));
    }

    public fun challenge_person(opponent: address, ctx: &mut TxContext) {
        assert!(opponent != tx_context::sender(ctx), ESame_Player);
        let challenge = Challenge{
            id: object::new(ctx),
            challenger: tx_context::sender(ctx),
            opponent: opponent,
        };
        transfer::transfer(challenge, opponent);
    }

    public fun accept_challenge(challenge: Challenge, ctx: &mut TxContext) {
        assert!(challenge.opponent == tx_context::sender(ctx), ESame_Player);
        event::emit(
            ChallengeAccepted{
                id: object::uid_to_inner(&challenge.id), 
                challenger: challenge.challenger,
                accepter: tx_context::sender(ctx),
        });

        // Create a new game
        let player_1 = Player{
            id: object::new(ctx),
            addr: challenge.challenger,
            deck_commitment: vector<u8>[], // get deck from player's owned objects (Cards) and shuffle
            deck_size: STARTING_DECK_SIZE,
            hand_commitment: vector<u8>[],   // committment
            hand_size: STARTING_HAND_SIZE,
            graveyard: vector<Card>[],
            board: vector<Card>[],
            life: STARTING_HEALTH,
            played_character_this_turn: false,
        };
        let player_2 = Player{
            id: object::new(ctx),
            addr: challenge.opponent,
            deck_commitment: vector<u8>[],
            deck_size: STARTING_DECK_SIZE,
            hand_commitment: vector<u8>[],
            hand_size: STARTING_HAND_SIZE,
            graveyard: vector<Card>[],
            board: vector<Card>[],
            life: STARTING_HEALTH,
            played_character_this_turn: false,
        };

        let game = Game{
            id: object::new(ctx),
            player_1: player_1,
            player_2: player_2,
            state: IS_WAITING_FOR_DRAW, //TODO: Change to IS_WAITING_FOR_PLAY (first turn no draw)
        };

        transfer::transfer(game, challenge.challenger);
        let Challenge {id, challenger: _, opponent: _ } = challenge;
        object::delete(id);
    }

    public fun draw(
        game: &mut Game, 
        vk: vector<u8>, 
        public_inputs_bytes: vector<u8>, 
        proof_points_bytes: vector<u8>,
        new_hand_commitment: vector<u8>,
        new_deck_commitment: vector<u8>,
        ctx: &mut TxContext) {
        assert!(game.state == IS_WAITING_FOR_DRAW, EInvalid_State);
        let (attacking_player, _) = get_players(game, ctx);
        assert!(attacking_player.deck_size > 0, EInvalid_Deck_Size);
        // assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EInvalid_Proof);

        // Place card in hand
        attacking_player.deck_commitment = new_deck_commitment;
        attacking_player.hand_commitment = new_hand_commitment;
        attacking_player.hand_size = attacking_player.hand_size + 1;
        attacking_player.deck_size = attacking_player.deck_size - 1;
        if(attacking_player.hand_size > STARTING_HAND_SIZE){
            game.state = IS_WAITING_FOR_DISCARD;
        }
        else{
            game.state = IS_WAITING_FOR_PLAY;
        };
    }

    public fun discard(
        game: &mut Game, 
        vk: vector<u8>, 
        public_inputs_bytes: vector<u8>, 
        proof_points_bytes: vector<u8>,
        card_to_discard: Card,
        new_hand_commitment: vector<u8>,
        ctx: &mut TxContext) {
        assert!(game.state == IS_WAITING_FOR_DISCARD, EInvalid_State);
        let (attacking_player, _) = get_players(game, ctx);
        assert!(attacking_player.hand_size > STARTING_HAND_SIZE, EInvalid_Hand_Size);
        // assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EInvalid_Proof);
        attacking_player.hand_commitment = new_hand_commitment;
        attacking_player.hand_size = attacking_player.hand_size - 1;
        vector::push_back(&mut attacking_player.graveyard, card_to_discard);
        if(attacking_player.hand_size == STARTING_HAND_SIZE){
            game.state = IS_WAITING_FOR_PLAY;
        }
        else{
            game.state = IS_WAITING_FOR_DISCARD;
        };
    }

    public fun play(
        game: &mut Game, 
        vk: vector<u8>, 
        public_inputs_bytes: vector<u8>, 
        proof_points_bytes: vector<u8>,
        card_to_play: Card,
        new_hand_commitment: vector<u8>,
        ctx: &mut TxContext) {
        assert!(game.state == IS_WAITING_FOR_PLAY, EInvalid_State);
        let (attacking_player, _) = get_players(game, ctx);
        // assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EInvalid_Proof);
        attacking_player.hand_commitment = new_hand_commitment;
        attacking_player.hand_size = attacking_player.hand_size - 1;
        vector::push_back(&mut attacking_player.board, card_to_play);
        attacking_player.played_character_this_turn = true;
        game.state = IS_WAITING_FOR_ATTACK;
    }
    
    // attacking characters are the characters that are attacking
    // defending characters are the characters that are being attacked
    // direct_player_attacks is the number of attacking characters
    //  that are going directly to the player
    // TODO: Change attack logic so that it must attack defending players board if defending_characters is empty before enemy player
    public fun attack(
        game: Game, 
    attacking_characters: vector<u64>, 
    defending_characters: vector<u64>, 
    direct_player_attacks: u64, 
    ctx: &mut TxContext){
        assert!(game.state == IS_WAITING_FOR_ATTACK, EInvalid_State);
        let (attacking_player, defending_player) = get_players(&mut game, ctx);

        let attacking_size = vector::length<u64>(&attacking_characters);
        let defending_size = vector::length<u64>(&defending_characters);

        let attacking_board_size = vector::length<Card>(&attacking_player.board);
        let defending_board_size = vector::length<Card>(&defending_player.board);

        assert!(attacking_size <= attacking_board_size, EAttackersNotSelectedCorrectly);
        // I.e. user can't select 2 characters and attack 3 objects
        assert!(attacking_size <= defending_size + direct_player_attacks, ETooManyDefendingCharacters); 
        assert!(defending_size <= defending_board_size, EDefendersNotSelectedCorrectly);  
        // User cannot attack with character that was played this turn      
        if(attacking_player.played_character_this_turn){
            assert!(!vector::contains(&attacking_characters, &(attacking_board_size - 1)), EAttackersNotSelectedCorrectly);
        };
        let game_over = false;
        // iterate over all attacking_characters and attack resepective opponent
        let i = 0;
        while(i < attacking_size){
            // get attacking character
            let attacking_character_index = *(vector::borrow<u64>(&attacking_characters, i));
            let attacking_character = vector::borrow_mut<Card>(&mut attacking_player.board, attacking_character_index);
            // attack the actual characters
            if(i < defending_size) {
                // get the defending character
                let defending_player_index = *(vector::borrow<u64>(&defending_characters, i));
                let defending_character = vector::borrow_mut<Card>(&mut defending_player.board, defending_player_index);

                // Compute the attack results (Sui doesn't support negative numbers)
                if(attacking_character.type.attack < defending_character.type.defense) {
                    defending_character.type.defense = defending_character.type.defense - attacking_character.type.attack;
                };
                if(attacking_character.type.defense > defending_character.type.attack){
                    attacking_character.type.defense = attacking_character.type.defense - defending_character.type.attack;
                }
                // remove characters from board
                else{
                    let remove_defending_character = false;
                    let remove_attacking_character = false;
                    if(attacking_character.type.attack >= defending_character.type.defense){
                        remove_defending_character = true;
                    };
                    if(attacking_character.type.defense <= defending_character.type.attack){
                        remove_attacking_character = true;
                    };

                    if(remove_defending_character) {
                        vector::push_back<Card>(&mut defending_player.graveyard, 
                        vector::remove<Card>(&mut defending_player.board, defending_player_index));
                    };

                    if(remove_attacking_character) {
                        vector::push_back<Card>(&mut attacking_player.graveyard, 
                        vector::remove<Card>(&mut attacking_player.board, attacking_character_index));
                    };
                };
            }   
            // attack the player
            else{
                if(defending_player.life > attacking_character.type.attack){
                    defending_player.life = defending_player.life - attacking_character.type.attack;
                }
                else{
                    defending_player.life = 0;
                    game_over = true;
                    break
                };
            };
            i = i + 1;
        };

        // clear out arrays and drop objects
        if(game_over){
            end_game(game, tx_context::sender(ctx));
        }
        else{
            end_turn(game, ctx);
        }
    }

    public fun end_turn(game: Game, ctx: &mut TxContext) {
        let (attacking_player, defending_player) = get_players(&mut game, ctx);
        attacking_player.played_character_this_turn = false;
        let defending_player_address = defending_player.addr;
        // if(attacking_player.hand_size > STARTING_HAND_SIZE) {
        //     discard()
        // }
        if (defending_player.deck_size > 0) {
            game.state = IS_WAITING_FOR_DRAW;
        }
        else{
            game.state = IS_WAITING_FOR_PLAY;
        };
        transfer::transfer(game, defending_player_address);
        event::emit(TurnEnded{player: tx_context::sender(ctx)});
    }

    public fun surrender(game: Game, ctx: &mut TxContext) {
        let (_, defending_player) = get_players(&mut game, ctx);
        let defending_player_address = defending_player.addr;
        end_game(game, defending_player_address);
    }

    // return players in order of attacking, defending
    public fun get_players(game: &mut Game, ctx: &mut TxContext): (&mut Player, &mut Player) {
        if(game.player_1.addr == tx_context::sender(ctx)) {
            (&mut game.player_1, &mut game.player_2)
        } else {
            (&mut game.player_2, &mut game.player_1)
        }
    }

    public fun verify_proof(vk: vector<u8>, public_inputs_bytes: vector<u8>, proof_points_bytes: vector<u8>): bool {
        let pvk = groth16::prepare_verifying_key(&groth16::bls12381(), &vk);
        let public_inputs = groth16::public_proof_inputs_from_bytes(public_inputs_bytes);
        let proof_points = groth16::proof_points_from_bytes(proof_points_bytes);
        let is_verified = groth16::verify_groth16_proof(&groth16::bls12381(), &pvk, &public_inputs, &proof_points);
        event::emit(VerifiedEvent {is_verified: is_verified});
        is_verified
    }

    /////////////////////////
    /// Private Functions ///
    /////////////////////////
    
    fun end_game(game: Game, winner: address) {
        event::emit(GameOver{
            id: object::uid_to_inner(&game.id),
            winner: winner
        });
        let Game{
            id: game_id,
            player_1: player_1,
            player_2: player_2,
            state: _,
        } = game;

        let Player{
            id: player_1_id,
            addr: _,
            deck_commitment: _,
            deck_size: _,
            hand_commitment: _,
            hand_size: _,
            graveyard: player_1_graveyard,
            board: player_1_board,
            life: _,
            played_character_this_turn: _,
        } = player_1;

        let Player{
            id: player_2_id,
            addr: _,
            deck_commitment: _,
            deck_size: _,
            hand_commitment: _,
            hand_size: _,
            graveyard: player_2_graveyard,
            board: player_2_board,
            life: _,
            played_character_this_turn: _,
        } = player_2;

        let p1_graveyard_size = vector::length<Card>(&player_1_graveyard);
        let p2_graveyard_size = vector::length<Card>(&player_2_graveyard);
        let p1_board_size = vector::length<Card>(&player_1_board);
        let p2_board_size = vector::length<Card>(&player_2_board);

        let i = 0;
        while(i < p1_graveyard_size){
            let card = vector::pop_back<Card>(&mut player_1_graveyard);
            let Card{
                id: card_id,
                name: _,
                description: _,
                type: Character{
                    attack: _,
                    defense: _,
                },
                image_url: _,
            } = card;
            object::delete(card_id);
            i = i + 1;
        };
        assert!(vector::length<Card>(&player_1_graveyard) == 0, EInvalidVectorDeletion);
        i = 0;
        while(i < p2_graveyard_size){
            let card = vector::pop_back<Card>(&mut player_2_graveyard);
            let Card{
                id: card_id,
                name: _,
                description: _,
                type: Character{
                    attack: _,
                    defense: _,
                },
                image_url: _,
            } = card;
            object::delete(card_id);
            i = i + 1;
        };
        assert!(vector::length<Card>(&player_2_graveyard) == 0, EInvalidVectorDeletion);
        i = 0;
        while(i < p1_board_size){
            debug::print(&i);
            let card = vector::pop_back<Card>(&mut player_1_board);
            let Card{
                id: card_id,
                name: _,
                description: _,
                type: Character{
                    attack: _,
                    defense: _,
                },
                image_url: _,
            } = card;
            object::delete(card_id);
            i = i + 1;
        };
        assert!(vector::length<Card>(&player_1_board) == 0, EInvalidVectorDeletion);
        i = 0;
        while(i < p2_board_size){
            let card = vector::pop_back<Card>(&mut player_2_board);
            let Card{
                id: card_id,
                name: _,
                description: _,
                type: Character{
                    attack: _,
                    defense: _,
                },
                image_url: _,
            } = card;
            object::delete(card_id);
            i = i + 1;
        };
        assert!(vector::length<Card>(&player_2_board) == 0, EInvalidVectorDeletion);

        vector::destroy_empty(player_1_graveyard);
        vector::destroy_empty(player_2_graveyard);
        vector::destroy_empty(player_2_board);
        vector::destroy_empty(player_1_board);
        object::delete(player_1_id);
        object::delete(player_2_id);
        object::delete(game_id);
    } 
}