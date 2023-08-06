module card_game::card_game {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::url::{Self, Url};
    use std::string::String;
    use sui::tx_context::{TxContext, Self};
    use std::option::{Self, Option, some};
    use sui::event;
    use std::vector;

    const STARTING_HEALTH: u64 = 100;
    const NO_WINNER: u64 = 0;
    const PLAYER_1_WINNER: u64 = 1;
    const PLAYER_2_WINNER: u64 = 2;

    const ESAME_PLAYER: u64 = 3;
    const EPLAYER_NOT_IN_GAME: u64 = 4;
    const EINDEX_OUT_OF_BOUNDS: u64 = 5;
    const ECHALLENGE_ERROR: u64 = 6;
    
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

    // deck = assets of user up to 8 cards

    public entry fun challenge_person(opponent: address, ctx: &mut TxContext) {
        let challenge = Challenge{
            id: object::new(ctx),
            challenger: tx_context::sender(ctx),
            opponent: opponent,
        };
        transfer::transfer(challenge, opponent);
    }

    public entry fun accept_challenge(challenge: Challenge, ctx: &mut TxContext) {
        assert!(challenge.opponent == tx_context::sender(ctx), ECHALLENGE_ERROR);
        event::emit(
            ChallengeAccepted{
                id: object::uid_to_inner(&challenge.id), 
                challenger: challenge.challenger,
                accepter: tx_context::sender(ctx),
        });
        start_game(challenge.challenger, ctx);
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

    public fun draw(game: &mut Game, ctx: &mut TxContext): &vector<Card>{
        let (player, _, _) = get_players(game, ctx);
        // TODO: Hash randomness from opponent + seed phrase generated at beginning % length of deck = index
        // let top_card = vector::pop_back<Card>(&mut player.deck);
        //vector::push_back<Card>(&mut player.hand, top_card);
        &player.hand
    }

    public fun discard(game: &mut Game, index: u64, ctx: &mut TxContext): &vector<Card>{
        let (player, _, _) = get_players(game, ctx);
        let card = replace_card(game, index, ctx);
        vector::push_back<Card>(&mut player.graveyard, card);
        &player.hand
    }

    public fun play_card(game: &mut Game, index: u64, ctx: &mut TxContext): &vector<Card> {
        let (player, _, _) = get_players(game, ctx);
        let card_to_play = vector::borrow_mut<Card>(&mut player.hand, index);
        // TODO: zk

        // move card from hand to board
        let card = replace_card(game, index, ctx);
        vector::push_back<Card>(&mut player.board, card);
        &player.board
    }

    public entry fun attack(
        game: &mut Game, 
    attacking_character_index: u64, 
    defending_character_index: u64, 
    ctx: &mut TxContext) {
        let game_over = false;
        let (attacking_player, defending_player, order) = get_players(game, ctx);
        if(order == true) {
            // choose a card from player_1's board to attack with
            let attacking_character = vector::borrow<Card>(&mut game.player_1.board, attacking_character_index);

            // choose a card from player_2's board to attack
            let defending_character = vector::borrow_mut<Card>(&mut game.player_2.board, defending_character_index);

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
            }
        }
        // repeat logic if player_2 is attacking
        else{
            let attacking_character = vector::borrow<Card>(&mut game.player_2.board, attacking_character_index);

            let defending_character = vector::borrow_mut<Card>(&mut game.player_1.board, defending_character_index);

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
                        winner: PLAYER_2_WINNER
                    });
                game_over = true;
            }
        };

        if(game_over) {
            let Game{
                id,
                player_1: player_1,
                player_2: player_2,
                winner: _,
            } = game;
            object::delete(id);
            // object::delete(player_1.id);
            // object::delete(player_2.id);
        }
    }

    public entry fun end_turn(game: Game, player_turn: address, ctx: &mut TxContext) {
         //assert!(player_turn != tx_context::sender(ctx), ESAME_PLAYER);
        let (player, _, _) = get_players(&mut game, ctx);
        assert!(player_turn == game.player_1.addr || player_turn == game.player_2.addr, EPLAYER_NOT_IN_GAME);
        // public randomness provided before end of turn
        
        transfer::transfer(game, player_turn);
    }

    // Todo: check if this function should exist in zk
    // public fun get_deck(game: &mut Game, ctx: &mut TxContext): &vector<Card> {
    //     let player = get_players(game, ctx);
    //     &player.deck
    // }
    
    ///////////////////////
    // PRIVATE FUNCTIONS //
    ///////////////////////

    // fun declare_winner(game: &mut Game): bool{
    //     let result = false;
    //     if(game.player_1.life == 0) {
    //         game.winner = PLAYER_2_WINNER;
    //         result = true;
    //     }
    //     else if(game.player_2.life == 0) {
    //         game.winner = PLAYER_1_WINNER;
    //         result = true;
    //     };
    //     result
    // }

    // return players in order of attacking -> defending
    fun get_players(game: &mut Game, ctx: &mut TxContext): (&mut Player, &mut Player, bool) {
        if(game.player_1.addr == tx_context::sender(ctx)) {
            (&mut game.player_1, &mut game.player_2, true)
        } else {
            (&mut game.player_2, &mut game.player_1, false)
        }
    }

    fun replace_card(game: &mut Game, index: u64, ctx: &mut TxContext): Card{
        let (player, _, _) = get_players(game, ctx);
        let size = vector::length<Card>(&mut player.hand);
        assert!(index < size, EINDEX_OUT_OF_BOUNDS);
        let card_to_delete = vector::borrow_mut<Card>(&mut player.hand, index);
        let i = 0;
        let card;
        // swap values in vector to place card we don't want at end and pop it
        while(i < size) {
            if(i == index) {
                let card_to_swap = vector::borrow_mut<Card>(&mut player.hand, size - 1);
                let temp = card_to_delete;
                card_to_delete = card_to_swap;
                card_to_swap = temp;
                card = vector::pop_back<Card>(&mut player.hand);
                break
            }
            else{
                i = i + 1;
            }
        };
        card
    }
}