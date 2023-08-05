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
    const ESAME_PLAYER: u64 = 4;
    const EPLAYER_NOT_IN_GAME: u64 = 5;
    const EINDEX_OUT_OF_BOUNDS: u64 = 6;
    
    // T is either character or spell
    struct Game has key, store{
        id: UID,
        player_1: Player,
        player_2: Player,
        board_state: BoardState,
        winner: u64
    }

    struct Player has store{
        id: UID,
        addr: address,
        deck: vector<Card>,
        hand: vector<Card>,
        graveyard: vector<Card>,
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
        life: u64,
        attack: u64,
    }

    // TODO: make player_1 board include player
    struct BoardState has store{
        player_1_board: vector<Card>,
        player_2_board: vector<Card>
    }

    struct GameOver has copy, drop {
        id: ID,
        winner: u64
    }

    // deck = assets of user up to 8 cards

    public entry fun start_game_with(opponent: address, ctx: &mut TxContext) {
        //assert!(opponent != tx_context::sender(ctx), ESAME_PLAYER);
        
        // get the deck from player's owned objects
        let player_1 = Player{
            id: object::new(ctx),
            addr: tx_context::sender(ctx),
            deck: vector<Card>[], // get deck from player's owned objects (Cards) and shuffle
            hand: vector<Card>[],  
            graveyard: vector<Card>[],
            life: STARTING_HEALTH,
        };
        let player_2 = Player{
            id: object::new(ctx),
            addr: opponent,
            deck: vector<Card>[],
            hand: vector<Card>[],
            graveyard: vector<Card>[],
            life: STARTING_HEALTH,
        };

        let game = Game{
            id: object::new(ctx),
            player_1: player_1,
            player_2: player_2,
            board_state: BoardState{
                player_1_board: vector<Card>[],
                player_2_board: vector<Card>[]
            },
            winner: NO_WINNER,
        };

        transfer::transfer(game, tx_context::sender(ctx));
    }

    // public entry fun make_move(game: Game, ctx: &mut TxContext) {
    //     if(declare_winner(game)) {
    //         let winner = game.winner;
    //         let id = object::new(ctx);
    //         event::emit(
    //             GameOver{
    //                 id: object::uid_to_inner(&id), 
    //                 winner}
    //             );
    //         let Game {
    //             id; id,
    //             player_1: _,
    //             player_2: _,
    //             board_state: _,
    //             winner:  _,
    //         } = game;
    //         object::delete(id);
    //     }
        

    //     1. make player play card -> place card onto board
    //     2. make player attack -> subtract health from opponent

    //     Decrement Health Opponent if Attack is made

        
    // }

    public fun draw(game: &mut Game, ctx: &mut TxContext): &vector<Card>{
        let (player, _, _) = get_players(game, ctx);
        // TODO: Hash randomness from opponent + seed phrase generated at beginning % length of deck = index
        // let top_card = vector::pop_back<Card>(&mut player.deck);
        vector::push_back<Card>(&mut player.hand, top_card);
        &player.hand
    }

    public fun discard(game: &mut Game, index: u64, ctx: &mut TxContext): &vector<Card>{
        let (player, _, _) = get_players(game, ctx);
        let size = vector::length<Card>(&mut player.hand);
        assert!(index < size, EINDEX_OUT_OF_BOUNDS);
        let card_to_delete = vector::borrow_mut<Card>(&mut player.hand, index);
        let i = 0;
        // swap values in vector to place card we don't want at end and pop it
        while(i < size) {
            if(i == index) {
                let card_to_swap = vector::borrow_mut<Card>(&mut player.hand, size - 1);
                let temp = card_to_delete;
                card_to_delete = card_to_swap;
                card_to_swap = temp;
                // make sure swap happens correctly;
                let obj = vector::pop_back<Card>(&mut player.hand);
                break
            }
            else{
                i = i + 1;
            }
        };

        //  TODO: Add to graveyard
        //vector::push_back<Card>(&mut player.graveyard, temp);
        &player.hand
    }

    // TODO: Figure out if board state should be apart of player struct
    public entry fun attack(
        game: Game, 
    attacking_character_index: u64, 
    defending_character_index: u64, 
    ctx: &mut TxContext) {
        let (attacking_player, defending_player, order) = get_players(&mut game, ctx);
        if(order == true) {
            // choose a card from player_1's board to attack with
            let attacking_character = vector::borrow<Card>(&mut game.board_state.player_1_board, attacking_character_index);

            // choose a card from player_2's board to attack
            let defending_character = vector::borrow_mut<Card>(&mut game.board_state.player_2_board, defending_character_index);

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
                let Game {
                    id,
                    player_1: _,
                    player_2: _,
                    board_state: _,
                    winner: _
                } = game;
                object::delete(id);
            }
        }
        // repeat logic if player_2 is attacking
        else{
            
        }

        

        

       
    }

    public entry fun end_turn(game: Game, player_turn: address, ctx: &mut TxContext) {
         //assert!(player_turn != tx_context::sender(ctx), ESAME_PLAYER);
        let (player, _) = get_players(&mut game, ctx);
        assert!(player_turn == game.player_1.addr || player_turn == game.player_2.addr, EPLAYER_NOT_IN_GAME);
        // public randomness provided before end of turn
        
        transfer::transfer(game, player_turn);
    }

    // Todo: check if this function should exist in zk
    public fun get_deck(game: &mut Game, ctx: &mut TxContext): &vector<Card> {
        let player = get_players(game, ctx);
        &player.deck
    }
    
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

    
}