import React from "react";
import State from "../State";
import { surrender, end_turn } from "../../calls/move_calls";
import { Button } from "@chakra-ui/react";
export default function Divider({
  isWaitingForDraw,
  isWaitingForDiscard,
  isWaitingForAttack,
  isWaitingForPlay,
  wallet,
  router,
  selected_cards_to_attack,
  selected_cards_to_defend,
  is_player_1,
  is_player_1_turn,
}: {
  isWaitingForDraw: boolean;
  isWaitingForDiscard: boolean;
  isWaitingForAttack: boolean;
  isWaitingForPlay: boolean;
  wallet: any;
  router: any;
  selected_cards_to_attack: any;
  selected_cards_to_defend: any;
  is_player_1: boolean;
  is_player_1_turn: boolean;
}) {
  return (
    <section className="flex flex-row justify-around">
      <Button
        colorScheme="yellow"
        isDisabled={
          is_player_1_turn && !is_player_1
            ? true
            : !is_player_1_turn && is_player_1
            ? true
            : false
        }
        onClick={() => end_turn(wallet, router.query.game_id as string)}
      >
        End Turn
      </Button>
      <State
        isWaitingForDraw={isWaitingForDraw}
        isWaitingForDiscard={isWaitingForDiscard}
        isWaitingForAttack={isWaitingForAttack}
        isWaitingForPlay={isWaitingForPlay}
        wallet={wallet}
        router={router}
        selected_cards_to_attack={selected_cards_to_attack}
        selected_cards_to_defend={selected_cards_to_defend}
        is_player_1={is_player_1}
        is_player_1_turn={is_player_1_turn}
      />
      <Button
        colorScheme="red"
        onClick={() => {
          surrender(wallet, router.query.game_id as string);
        }}
      >
        Surrender
      </Button>
    </section>
  );
}
