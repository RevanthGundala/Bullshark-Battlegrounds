// This module contains integration tests for the card_game module
#[test_only]
#[allow(unused_use, unused_variable, unused_assignment)]
module card_game::card_game_integration_test {
    use card_game::card_game::{Self, Game, Challenge, Card};
    use sui::test_scenario::{Self, next_tx, ctx, take_from_sender, return_to_address, end, begin};
    use std::vector;
    use std::debug;
    use std::string::{Self};

    fun get_characters(player_1: address, player_2: address, scenario: &mut test_scenario::Scenario) {
        let i = 0;
        while(i < 10){
            next_tx(scenario, player_1);
            {
                card_game::get_new_character(
                    vector::empty<u8>(),
                    vector::empty<u8>(),
                    vector::empty<u8>(),
                    1,
                    0,
                    ctx(scenario)
                );
            };
            next_tx(scenario, player_2);
            {
                card_game::get_new_character(
                    vector::empty<u8>(),
                    vector::empty<u8>(),
                    vector::empty<u8>(),
                    1,
                    0,
                    ctx(scenario)
                );
            };
            i = i + 1;
        };
    }

    fun challenge_and_accept(player_1: address, player_2: address, scenario: &mut test_scenario::Scenario){
        next_tx(scenario, player_1);
        {
            card_game::challenge_person(player_2, ctx(scenario));
            // let challenge = take_from_sender<Challenge>(&scenario);
            // assert!(&challenge.challenger == player_1, 0);
            // assert!(challenge.opponent == player_2, 0);
        };
        next_tx(scenario, player_2);
        {
            let challenge = take_from_sender<Challenge>(scenario);
            card_game::accept_challenge(challenge, ctx(scenario));
        };
    }

    fun draw(player: address, scenario: &mut test_scenario::Scenario) {
        next_tx(scenario, player);
        {
            let game = take_from_sender<Game>(scenario);
            card_game::draw(
                &mut game,
                vector::empty<u8>(),
                vector::empty<u8>(),
                vector::empty<u8>(),
                vector::empty<u8>(),
                vector::empty<u8>(),
                ctx(scenario)
            );
            return_to_address<Game>(player, game);
        };
    }

    fun discard(player: address, scenario: &mut test_scenario::Scenario){
        next_tx(scenario, player);
        {
            let game = take_from_sender<Game>(scenario);
            let card_to_discard = take_from_sender<Card>(scenario);
            card_game::discard(
                &mut game,
                vector::empty<u8>(),
                vector::empty<u8>(),
                vector::empty<u8>(),
                card_to_discard,
                vector::empty<u8>(),
                ctx(scenario)
            );
            return_to_address<Game>(player, game);
        };
    }

    fun play(player: address, scenario: &mut test_scenario::Scenario) {
        next_tx(scenario, player);
        {
            let game = take_from_sender<Game>(scenario);
            let card_to_play = take_from_sender<Card>(scenario);
            card_game::play(
                &mut game,
                vector::empty<u8>(),
                vector::empty<u8>(),
                vector::empty<u8>(),
                card_to_play,
                vector::empty<u8>(),
                ctx(scenario)
            );
            return_to_address<Game>(player, game);
        };
    }

    fun attack(player: address, scenario: &mut test_scenario::Scenario) {
        next_tx(scenario, player);
        {
            let game = take_from_sender<Game>(scenario);
            let attacking_characters = vector::empty<u64>();
            vector::push_back(&mut attacking_characters, 0);
            card_game::attack(
                game,
                attacking_characters,
                vector::empty<u64>(),
                1,
                ctx(scenario)
            );
        };
    }

    fun end_turn(player: address, scenario: &mut test_scenario::Scenario) {
        next_tx(scenario, player);
        {
            let game = take_from_sender<Game>(scenario);
            card_game::end_turn(
                game,
                ctx(scenario)
            );
        };
    }

    fun end_game(winner: address, scenario: &mut test_scenario::Scenario) {
        next_tx(scenario, winner);
        {
            let game = take_from_sender<Game>(scenario);
            card_game::end_game(
                game,
                winner,
            );
        };
    }

    #[test]
    fun test_challenge_and_accept() {
        let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        challenge_and_accept(player_1, player_2, &mut scenario);
        end(scenario);
    }

    #[test]
    fun test_get_characters() {
        let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        get_characters(player_1, player_2, &mut scenario);
        end(scenario);
    }

    #[test]
    fun test_draw_and_discard() {
       let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        get_characters(player_1, player_2, &mut scenario);
        challenge_and_accept(player_1, player_2, &mut scenario);
        draw(player_1, &mut scenario);
        discard(player_1, &mut scenario);
        end(scenario);
    }

    #[test]
    fun test_play() {
        let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        get_characters(player_1, player_2, &mut scenario);
        challenge_and_accept(player_1, player_2, &mut scenario);
        draw(player_1, &mut scenario);
        discard(player_1, &mut scenario);
        play(player_1, &mut scenario);
        end(scenario);
    }

    #[test]
    fun test_attack() {
        let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        get_characters(player_1, player_2, &mut scenario);
        challenge_and_accept(player_1, player_2, &mut scenario);
        draw(player_1, &mut scenario);
        discard(player_1, &mut scenario);
        play(player_1, &mut scenario);
        end_turn(player_1, &mut scenario);
        // needs to draw one more time before we can attack
        draw(player_2, &mut scenario);
        discard(player_2,&mut scenario);
        play(player_2, &mut scenario);
        end_turn(player_2, &mut scenario);
        draw(player_1, &mut scenario);
        play(player_1, &mut scenario);
        // will auto end turn or end game
        attack(player_1, &mut scenario); //TODO: Figure out how to get the card we want to attack with
        end(scenario);
    }

    #[test]
    fun test_end_turn() {
        let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        challenge_and_accept(player_1, player_2, &mut scenario);
        end_turn(player_1, &mut scenario);
        end(scenario);
    }

    #[test]
    fun test_end_game() {
        let player_1 = @0xA;
        let player_2 = @0xB; 
        let scenario = begin(player_1);
        challenge_and_accept(player_1, player_2, &mut scenario);
        end_game(player_1, &mut scenario);
        end(scenario);
    }

}