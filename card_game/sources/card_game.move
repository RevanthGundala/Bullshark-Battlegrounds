module card_game::card_game {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::tx_context::{TxContext, Self};
    use std::option::{Self, Option, some};
    use sui::event;
    use std::vector;
    use sui::groth16;
    use std::hash;

    const STARTING_HEALTH: u64 = 100;
    const NO_WINNER: u64 = 0;
    const PLAYER_1_WINNER: u64 = 1;
    const PLAYER_2_WINNER: u64 = 2;

    const ESAME_PLAYER: u64 = 3;
    const EPLAYER_NOT_IN_GAME: u64 = 4;
    const EINDEX_OUT_OF_BOUNDS: u64 = 5;
    const EINVALID_PROOF: u64 = 6;
    
    // T is either character or spell
    struct Game has key, store{
        id: UID,
        player_1: Player,
        player_2: Player,
        // board: Board,
        winner: u64
    }

    struct Player has key, store{
        id: UID,
        addr: address,
        deck: vector<Card>,
        hand: vector<Card>,
        graveyard: vector<Card>,
        board: vector<Card>,
        private_seed: vector<u8>,
        turn_randomness: vector<u8>,
        life: u64,
    }

    // struct Board has store {
    //     player_1_board: vector<Card>,
    //     player_2_board: vector<Card>,
    // }

    struct Card has key, store{
        id: UID,
        name: String,
        description: String,
        // TODO: Add spells as type as well(potions/buffs/etc)
        type: Character,
        image_url: Url,
    }

    struct Challenge has key {
        id: UID,
        challenger: address,
        opponent: address,
    }

    struct Character has store {
        life: u64,
        attack: u64,
    }

    struct GameOver has copy, drop {
        id: ID,
        winner: u64
    }

    struct ChallengeAccepted has copy, drop {
        id: ID,
        challenger: address,
        accepter: address
    }

    struct VerifiedEvent has copy, drop {
        is_verified: bool,
    }

    // deck = assets of user up to 8 cards

    public entry fun challenge_person(opponent: address, ctx: &mut TxContext) {
        assert!(opponent != tx_context::sender(ctx), ESAME_PLAYER);
        let challenge = Challenge{
            id: object::new(ctx),
            challenger: tx_context::sender(ctx),
            opponent: opponent,
        };
        transfer::transfer(challenge, opponent);
    }

    public entry fun accept_challenge(
        challenge: Challenge, 
    sender_private_seed: u256, 
    opponent_private_seed: u256, ctx: &mut TxContext) {
        assert!(challenge.opponent != tx_context::sender(ctx), ESAME_PLAYER);
        event::emit(
            ChallengeAccepted{
                id: object::uid_to_inner(&challenge.id), 
                challenger: challenge.challenger,
                accepter: tx_context::sender(ctx),
        });
        let Challenge {id, 
        challenger: _, 
        opponent: _ } = challenge;
        object::delete(id);
    }

    public entry fun start_game(opponent: address, ctx: &mut TxContext) {
        //assert!(opponent != tx_context::sender(ctx), ESAME_PLAYER);
        
        // get the deck from player's owned objects
        let player_1 = Player{
            id: object::new(ctx),
            addr: tx_context::sender(ctx),
            deck: vector<Card>[], // get deck from player's owned objects (Cards) and shuffle
            hand: vector<Card>[],  
            graveyard: vector<Card>[],
            board: vector<Card>[],
            life: STARTING_HEALTH,
        };
        let player_2 = Player{
            id: object::new(ctx),
            addr: opponent,
            deck: vector<Card>[],
            hand: vector<Card>[],
            graveyard: vector<Card>[],
            board: vector<Card>[],
            life: STARTING_HEALTH,
        };

        let game = Game{
            id: object::new(ctx),
            player_1: player_1,
            player_2: player_2,
            winner: NO_WINNER,
        };

        transfer::transfer(game, tx_context::sender(ctx));
    }

    // uses opponent randomness at end of turn + private committment to generate random num
    // TODO: Figure out how to hide card in hand
    public fun draw(
        game: &mut Game, 
        random_number: u64, 
        vk: vector<u8>,
        public_inputs_bytes: vector<u8>,
        proof_points_bytes: vector<u8>,
        ctx: &mut TxContext): &vector<Card>{
        assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EINVALID_PROOF);
        let (attacking_player, defending_player) = get_players(game, ctx);
        let size = vector::length<Card>(&attacking_player.deck);
        let random_index = random_number % size;
        let card_to_draw = vector::swap_remove<Card>(&mut attacking_player.deck, random_index);
        &attacking_player.hand
    }

    public fun discard(game: &mut Game, index: u64, ctx: &mut TxContext): &vector<Card>{
        let (player, _) = get_players(game, ctx);
        assert!(index < vector::length<Card>(&player.hand), EINDEX_OUT_OF_BOUNDS);
        let card = vector::swap_remove<Card>(&mut player.hand, index);
        vector::push_back<Card>(&mut player.graveyard, card);
        &player.hand
    }

    public fun play_card(game: &mut Game, index: u64, ctx: &mut TxContext): &vector<Card> {
        let (player, _) = get_players(game, ctx);
        assert!(index < vector::length<Card>(&player.hand), EINDEX_OUT_OF_BOUNDS);
        // TODO: zk

        // move card from hand to board
        let card = vector::swap_remove<Card>(&mut player.hand, index);
        vector::push_back<Card>(&mut player.board, card);
        &player.board
    }

    public entry fun attack(
        game: Game, 
    attacking_character_index: u64, 
    defending_character_index: u64, 
    ctx: &mut TxContext){
        let game_over = false;
        let (attacking_player, defending_player) = get_players(&mut game, ctx);
        // choose a card from player_1's board to attack with
        let attacking_character = vector::borrow<Card>(&attacking_player.board, attacking_character_index);

        // choose a card from player_2's board to attack
        let defending_character = vector::borrow_mut<Card>(&mut defending_player.board, defending_character_index);

            // subtract health from player_2's card and health
        if(attacking_character.type.attack >= defending_character.type.life) {
            let difference = attacking_character.type.attack - defending_character.type.life;
            defending_character.type.life = 0;
            defending_player.life = defending_player.life - difference;
        } else {
            defending_character.type.life = defending_character.type.life - attacking_character.type.attack;
        };
        
        if(defending_player.life <= 0) {
            event::emit(
                GameOver{
                    id: object::uid_to_inner(&game.id), 
                    winner: PLAYER_1_WINNER
                });
            game_over = true;
        };
        
        // TODO: Delete game
        if(game_over) {
            let Game{
                id: game_id,
                player_1: player_1,
                player_2: player_2,
                winner: _,
            } = game;

            let Player{
                id: player_1_id,
                addr: _,
                deck: player_1_deck,
                hand: player_1_hand,
                graveyard: player_1_graveyard,
                board: player_1_board,
                life: _,
            } = player_1;

            // // Todo: find min length of decks and delete in order instead of deleting all one by one
            let i = 0;
            let size = vector::length<Card>(&mut player_1_deck);
            while(i < size){
                let card = vector::pop_back<Card>(&mut player_1_deck);
                let Card{
                    id: card_id,
                    name: _,
                    description: _,
                    type: Character{
                        attack: _,
                        life: _
                    },
                    image_url: _,
                } = card;
                object::delete(card_id);
                i = i + 1;
            };
            vector::destroy_empty<Card>(player_1_deck);

            i = 0;
            size = vector::length<Card>(&mut player_1_hand);
            while(i < size){
                let card = vector::pop_back<Card>(&mut player_1_hand);
                let Card{
                    id: card_id,
                    name: _,
                    description: _,
                    type: Character{
                        attack: _,
                        life: _
                    },
                    image_url: _,
                } = card;
                object::delete(card_id);
                i = i + 1;
            };
            vector::destroy_empty<Card>(player_1_hand);

            i = 0;
            size = vector::length<Card>(&mut player_1_graveyard);
            while(i < size){
                let card = vector::pop_back<Card>(&mut player_1_graveyard);
                let Card{
                    id: card_id,
                    name: _,
                    description: _,
                   type: Character{
                        attack: _,
                        life: _
                    },
                    image_url: _,
                } = card;
                object::delete(card_id);
                i = i + 1;
            };
            vector::destroy_empty<Card>(player_1_graveyard);

            i = 0;
            size = vector::length<Card>(&mut player_1_board);
            while(i < size){
                let card = vector::pop_back<Card>(&mut player_1_board);
                let Card{
                    id: card_id,
                    name: _,
                    description: _,
                    type: Character{
                        attack: _,
                        life: _
                    },
                    image_url: _,
                } = card;
                object::delete(card_id);
                i = i + 1;
            };
            vector::destroy_empty<Card>(player_1_board);


            //object::delete(attacking_player_id);

            
            object::delete(game_id);
        }
    }

    public entry fun end_turn(
        game: Game, 
    player_turn: address, 
    randomness: u256,
    ctx: &mut TxContext) {
        assert!(player_turn != tx_context::sender(ctx), ESAME_PLAYER);
        let (player, _) = get_players(&mut game, ctx);
        assert!(player_turn == game.player_1.addr || player_turn == game.player_2.addr, EPLAYER_NOT_IN_GAME);
        transfer::transfer(game, player_turn);
    }

    // Todo: check if this function should exist in zk
    // public fun get_deck(game: &mut Game, ctx: &mut TxContext): &vector<Card> {
    //     let player = get_players(game, ctx);
    //     &player.deck
    // }

    public fun verify_proof(vk: vector<u8>, public_inputs_bytes: vector<u8>, proof_points_bytes: vector<u8>): bool {
        let pvk = groth16::prepare_verifying_key(&groth16::bn254(), &vk);
        let public_inputs = groth16::public_proof_inputs_from_bytes(public_inputs_bytes);
        let proof_points = groth16::proof_points_from_bytes(proof_points_bytes);
        let is_verified = groth16::verify_groth16_proof(&groth16::bn254(), &pvk, &public_inputs, &proof_points);
        event::emit(VerifiedEvent {is_verified: is_verified});
        is_verified
    }
    
    ///////////////////////
    // PRIVATE FUNCTIONS //
    ///////////////////////

    // return players in order of attacking -> defending
    fun get_players(game: &mut Game, ctx: &mut TxContext): (&mut Player, &mut Player) {
        if(game.player_1.addr == tx_context::sender(ctx)) {
            (&mut game.player_1, &mut game.player_2)
        } else {
            (&mut game.player_2, &mut game.player_1)
        }
    }

    // fun replace_card(game: &mut Game, index: u64, ctx: &mut TxContext): Card{
    //     let (player, _) = get_players(game, ctx);
    //     let size = vector::length<Card>(&mut player.hand);
    //     assert!(index < size, EINDEX_OUT_OF_BOUNDS);
    //     let card_to_delete = vector::borrow_mut<Card>(&mut player.hand, index);
    //     let i = 0;
    //     // swap values in vector to place card we don't want at end and pop it
    //     while(i < size) {
    //         if(i == index) {
    //             let card_to_swap = vector::borrow_mut<Card>(&mut player.hand, size - 1);
    //             let temp = card_to_delete;
    //             card_to_delete = card_to_swap;
    //             card_to_swap = temp;
    //             let card = vector::pop_back<Card>(&mut player.hand);
    //             return card
    //         }
    //         else{
    //             i = i + 1;
    //         }
    //     };
    //     Card{
    //         id: object::new(ctx),
    //         name: string::utf8(b""),
    //         description: string::utf8(b""),
    //         type: Character{life: 0, attack: 0},
    //         image_url: url::new_unsafe_from_bytes(b""),
    //     }
    // }
}