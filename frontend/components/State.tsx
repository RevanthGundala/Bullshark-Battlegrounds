import { Button } from "@chakra-ui/react";
import { attack } from "../calls/move_calls";
import { Wallet } from "ethos-connect";
import { NextRouter } from "next/router";

interface Card {
  id: string;
  name: string;
  description: string;
  attack: string;
  defense: string;
  image_url: string;
}

interface StateProps {
  isWaitingForDiscard: boolean;
  isWaitingForAttack: boolean;
  toggle_isWaitingForAttack: () => void;
  isWaitingForPlay: boolean;
  wallet: Wallet | undefined;
  router: NextRouter;
  selected_cards_to_attack: number[] | null;
  selected_cards_to_defend: number[] | null;
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
  isWaitingForDiscard,
  isWaitingForAttack,
  toggle_isWaitingForAttack,
  isWaitingForPlay,
  wallet,
  router,
  selected_cards_to_attack,
  selected_cards_to_defend,
}) => {
  return (
    <div>
      {isWaitingForDiscard ? (
        <h1>Waiting for discard</h1>
      ) : (
        <>
          {isWaitingForPlay ? (
            <h1>Waiting for play</h1>
          ) : (
            <>
              {isWaitingForAttack ? (
                <Button
                  onClick={async () => {
                    await attack_opponent(
                      wallet,
                      router,
                      selected_cards_to_attack,
                      selected_cards_to_defend
                    );
                    toggle_isWaitingForAttack();
                  }}
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
    </div>
  );
};

export default State;
