module card_game::card_game {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::url::{Self, Url};
    use std::string::String;
    use sui::tx_context::{TxContext, Self};
    use std::option::{Self, Option, some};
    use sui::event;

    const STARTING_HEALTH: u64 = 100;
    const NO_WINNER: u64 = 0;
    const PLAYER_1_WINNER: u64 = 1;
    const PLAYER_2_WINNER: u64 = 2;
    const ESAME_PLAYER: u64 = 4;
    
    // T is either character or spell
    struct Game has key, store{
        id: UID,
        player_1: Player,
        player_2: Player,
        board_state: BoardState,
        winner: u64
    }

    struct Player has store{
        addr: address,
        hand: vector<Card>,
        deck: vector<Card>,
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
        health: u64,
        attack: u64,
    }

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
        let player_1 = Player{
            addr: tx_context::sender(ctx),
            hand: vector<Card>[],
            deck: vector<Card>[],
            graveyard: vector<Card>[],
            life: STARTING_HEALTH
        };
        let player_2 = Player{
            addr: opponent,
            hand: vector<Card>[],
            deck: vector<Card>[],
            graveyard: vector<Card>[],
            life: STARTING_HEALTH
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

    public entry fun make_move(game: &mut Game, ctx: &mut TxContext) {
        // if(declare_winner(game)) {
        //     let winner = game.winner;
        //     let id = object::new(ctx);
        //     event::emit(
        //         GameOver{
        //             id: object::uid_to_inner(&id), 
        //             winner}
        //         );
        //     let Game {
        //         id,
        //         player_1: _,
        //         player_2: _,
        //         board_state: _,
        //         winner:  _,
        //     } = game;
        //     object::delete(id);
        // }
    }

    public entry fun end_turn(game: Game, player_turn: address) {
        transfer::transfer(game, player_turn);
    }

    fun declare_winner(game: &mut Game): bool{
        let result = false;
        if(game.player_1.life == 0) {
            game.winner = PLAYER_2_WINNER;
            result = true;
        }
        else if(game.player_2.life == 0) {
            game.winner = PLAYER_1_WINNER;
            result = true;
        };
        result
    }
}