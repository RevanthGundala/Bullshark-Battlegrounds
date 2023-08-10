module card_game::card_game {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::tx_context::{TxContext, Self};
//    use std::option::{Self, Option, some};
    use sui::event;
    use std::vector;
    use sui::groth16;
    // use std::hash;
    use sui::ecvrf;
    
    // CONSTANTS
    const STARTING_HEALTH: u64 = 100;
    const STARTING_DECK_SIZE: u64 = 10;
    const STARTING_HAND_SIZE: u64 = 6;

    // ERRORS
    const ESAME_PLAYER: u64 = 3;
    const EPLAYER_NOT_IN_GAME: u64 = 4;
    const EINDEX_OUT_OF_BOUNDS: u64 = 5;
    const EINVALID_PROOF: u64 = 7;
    const EINVALID_VRF: u64 = 8;
    const EINVALID_HAND_SIZE: u64 = 9;
    const EAttackersNotSelectedCorrectly: u64 = 10;
    const EDefendersNotSelectedCorrectly: u64 = 11;
    const ETooManyDefendingCharacters: u64 = 12;
    const EAttackersAndDefendersNotEqual: u64 = 13;
    const EInvalid_Deck_Size: u64 = 14;
    
    struct Game has key, store{
        id: UID,
        player_1: Player,
        player_2: Player
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
    }

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
        winner: address,
        loser: address,
    }

    struct VerifiedEvent has copy, drop {
        is_verified: bool,
    }

    fun init(ctx: &mut TxContext) {

    }

    public fun challenge_person(opponent: address, ctx: &mut TxContext) {
        assert!(opponent != tx_context::sender(ctx), ESAME_PLAYER);
        let challenge = Challenge{
            id: object::new(ctx),
            challenger: tx_context::sender(ctx),
            opponent: opponent,
        };
        transfer::transfer(challenge, opponent);
    }

    public entry fun accept_challenge(challenge: Challenge, ctx: &mut TxContext) {
        assert!(challenge.opponent == tx_context::sender(ctx), ESAME_PLAYER);
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
        };

        let game = Game{
            id: object::new(ctx),
            player_1: player_1,
            player_2: player_2
        };

        transfer::transfer(game, challenge.challenger);

        let Challenge {id, challenger: _, opponent: _ } = challenge;
        object::delete(id);
    }

    // use vrf to get random index
    // TODO: Figure out how to hide card in hand
    public entry fun draw(
        game: &mut Game, 
        output: vector<u8>, 
        alpha_string: vector<u8>, 
        public_key: vector<u8>, 
        proof: vector<u8>,
        vk: vector<u8>, 
        public_inputs_bytes: vector<u8>, 
        proof_points_bytes: vector<u8>,
        new_hand_commitment: vector<u8>,
        ctx: &mut TxContext){
        let (attacking_player, _) = get_players(game, ctx);
        assert!(attacking_player.deck_size > 0, EInvalid_Deck_Size);
        assert!(verify_ecvrf_output(output, alpha_string, public_key, proof), EINVALID_VRF);
        assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EINVALID_PROOF);
        // let random_index = vector::pop_back(&mut output) % (attacking_player.hand_size as u8);
        // let card_to_draw = vector::swap_remove<Card>(&mut attacking_player.deck, (random_index as u64));

        // Place card in hand
        attacking_player.hand_commitment = new_hand_commitment;
        attacking_player.hand_size = attacking_player.hand_size + 1;
        attacking_player.deck_size = attacking_player.deck_size - 1;
    }

    public fun discard(
        game: &mut Game, 
        output: vector<u8>, 
        alpha_string: vector<u8>, 
        public_key: vector<u8>, 
        proof: vector<u8>,
        vk: vector<u8>, 
        public_inputs_bytes: vector<u8>, 
        proof_points_bytes: vector<u8>,
        card_to_discard: Card,
        ctx: &mut TxContext): &vector<Card>{
        let (attacking_player, _) = get_players(game, ctx);
        assert!(attacking_player.hand_size > STARTING_HAND_SIZE, EINVALID_HAND_SIZE);
        assert!(verify_ecvrf_output(output, alpha_string, public_key, proof), EINVALID_VRF);
        assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EINVALID_PROOF);
        attacking_player.hand_size = attacking_player.hand_size - 1;
        vector::push_back(&mut attacking_player.graveyard, card_to_discard);
        &attacking_player.graveyard
    }

    public fun play(
        game: &mut Game, 
        output: vector<u8>, 
        alpha_string: vector<u8>, 
        public_key: vector<u8>, 
        proof: vector<u8>,
        vk: vector<u8>, 
        public_inputs_bytes: vector<u8>, 
        proof_points_bytes: vector<u8>,
        card_to_play: Card,
        ctx: &mut TxContext): &vector<Card> {
        let (attacking_player, _) = get_players(game, ctx);
        assert!(verify_ecvrf_output(output, alpha_string, public_key, proof), EINVALID_VRF);
        assert!(verify_proof(vk, public_inputs_bytes, proof_points_bytes), EINVALID_PROOF);
        attacking_player.hand_size = attacking_player.hand_size - 1;
        vector::push_back(&mut attacking_player.board, card_to_play);
        &attacking_player.board
    }
    
    public fun attack(
        game: Game, 
    attacking_characters: vector<Card>, 
    defending_characters: vector<Card>, 
    direct_player_attacks: vector<u64>, 
    ctx: &mut TxContext){
        let game_over = false;
        let dead_cards = vector<Card>[];
        let (attacking_player, defending_player) = get_players(&mut game, ctx);

        let attacking_size = vector::length<Card>(&attacking_characters);
        let defending_size = vector::length<Card>(&defending_characters);
        let direct_player_attack_size = vector::length<u64>(&direct_player_attacks);

        let attacking_board_size = vector::length<Card>(&attacking_player.board);
        let defending_board_size = vector::length<Card>(&defending_player.board);
       
        assert!(attacking_size <= attacking_board_size, EAttackersNotSelectedCorrectly);
        // I.e. user can't select 2 characters and attack 3 objects
        assert!(attacking_size <= defending_size + direct_player_attack_size, ETooManyDefendingCharacters); 
        assert!(defending_size >= defending_board_size, EDefendersNotSelectedCorrectly);        

        
        
        // iterate over all attacking_characters and attack resepective opponent
        let i = 0;
        while(i < attacking_size){
            // get attacking character
            let attacking_character = vector::borrow_mut<Card>(&mut attacking_characters, i);
            // attack the actual characters
            if(i < defending_size) {
                // get the defending character
                let defending_character = vector::borrow_mut<Card>(&mut defending_characters, i);

                // Compute the attack results (Sui doesn't support negative numbers)
                if(attacking_character.type.attack < defending_character.type.defense) {
                    let difference = defending_character.type.defense - attacking_character.type.attack;
                    defending_character.type.defense = difference;
                };
                if(attacking_character.type.defense > defending_character.type.attack){
                    let difference = attacking_character.type.defense - defending_character.type.attack;
                    attacking_character.type.defense = difference;
                }
                // remove characters from board
                else{
                    if(attacking_character.type.attack >= defending_character.type.defense){
                        let dead_card = vector::remove<Card>(&mut defending_player.board, i);
                        vector::push_back<Card>(&mut dead_cards, dead_card);
                    };
                    if(attacking_character.type.defense <= defending_character.type.attack){
                        let dead_card = vector::remove<Card>(&mut attacking_player.board, i);
                        vector::push_back<Card>(&mut dead_cards, dead_card);
                    };
                };
            }   
            // attack the player
            else{
                defending_player.life = defending_player.life - attacking_character.type.attack;
                // Game is over check
                if(defending_player.life <= 0){
                    game_over = true;
                    break
                };
            };
            i = i + 1;
        };

        if(game_over){
            end_game(game, ctx);
        }
    }

    public entry fun end_turn(game: Game, ctx: &mut TxContext) {
        let (_, defending_player) = get_players(&mut game, ctx);
        let defending_player_address = defending_player.addr;
        transfer::transfer(game, defending_player_address);
        event::emit(TurnEnded{player: tx_context::sender(ctx)});
    }

    public entry fun surrender(game: Game, ctx: &mut TxContext) {
        end_game(game, ctx);
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
        let pvk = groth16::prepare_verifying_key(&groth16::bn254(), &vk);
        let public_inputs = groth16::public_proof_inputs_from_bytes(public_inputs_bytes);
        let proof_points = groth16::proof_points_from_bytes(proof_points_bytes);
        let is_verified = groth16::verify_groth16_proof(&groth16::bn254(), &pvk, &public_inputs, &proof_points);
        event::emit(VerifiedEvent {is_verified: is_verified});
        is_verified
    }

    public fun verify_ecvrf_output(output: vector<u8>, alpha_string: vector<u8>, public_key: vector<u8>, proof: vector<u8>): bool {
        let is_verified = ecvrf::ecvrf_verify(&output, &alpha_string, &public_key, &proof);
        event::emit(VerifiedEvent {is_verified: is_verified});
        is_verified
    }

    /////////////////////////
    /// Private Functions ///
    /////////////////////////

    fun end_game(game: Game, ctx: &mut TxContext) {
        let (attacking_player, defending_player) = get_players(&mut game, ctx);
        
        event::emit(GameOver{
            id: object::uid_to_inner(&game.id),
            winner: attacking_player.addr,
            loser: defending_player.addr,
        });
        
        let Game{
            id,
            player_1: _,
            player_2: _,
        } = game;

        object::delete(id);
    } 
}