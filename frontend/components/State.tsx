import { Button } from "@chakra-ui/react";
import { attack } from "../calls/move_calls";
import { Wallet } from "ethos-connect";
import { NextRouter } from "next/router";

interface StateProps {
  isWaitingForDraw: boolean;
  isWaitingForDiscard: boolean;
  isWaitingForAttack: boolean;
  isWaitingForPlay: boolean;
  wallet: Wallet | undefined;
  router: NextRouter;
  selected_cards_to_attack: number[] | null;
  selected_cards_to_defend: number[] | null;
  is_player_1: boolean;
  is_player_1_turn: boolean;
}

async function attack_opponent(
  wallet: Wallet | undefined,
  router: NextRouter,
  selected_cards_to_attack: number[] | null,
  selected_cards_to_defend: number[] | null
) {
  console.log("State.tsx: attacking_cards: ", selected_cards_to_attack?.length);
  let directPlayerAttacks = 0;
  if (selected_cards_to_attack && selected_cards_to_defend) {
    directPlayerAttacks =
      selected_cards_to_attack?.length - selected_cards_to_defend?.length;
    let game_over = await attack(
      wallet,
      router.query.game_id as string,
      selected_cards_to_attack, // attacking character indices
      selected_cards_to_defend,
      directPlayerAttacks
    );
    if (game_over) {
      window.alert("Game over!");
      router.push("/");
    }
  }
}

const State: React.FC<StateProps> = ({
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
}) => {
  return (
    <div>
      {isWaitingForDraw ? (
        <h1>
          {is_player_1_turn ? "Waiting for p1 draw" : "Waiting for p2 draw"}
        </h1>
      ) : (
        <>
          {isWaitingForDiscard ? (
            <h1>
              {is_player_1_turn
                ? "Waiting for p1 discard"
                : "Waiting for p2 discard"}
            </h1>
          ) : (
            <>
              {isWaitingForPlay ? (
                <h1>
                  {is_player_1_turn
                    ? "Waiting for p1 play"
                    : "Waiting for p2 play"}
                </h1>
              ) : (
                <>
                  {isWaitingForAttack ? (
                    <Button
                      onClick={async () =>
                        await attack_opponent(
                          wallet,
                          router,
                          selected_cards_to_attack,
                          selected_cards_to_defend
                        )
                      }
                      disabled={
                        (is_player_1_turn && is_player_1) ||
                        (!is_player_1_turn && !is_player_1)
                          ? false
                          : true
                      }
                    >
                      Attack
                    </Button>
                  ) : (
                    <h1>Waiting for game...</h1>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default State;
