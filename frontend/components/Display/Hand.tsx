import React from "react";
import { Image, Tooltip, Button, Box } from "@chakra-ui/react";

export default function Hand({
  player_obj,
  isWaitingForAttack,
  show_cards,
  handleCardClick,
}: {
  player_obj: any;
  isWaitingForAttack: boolean;
  show_cards: boolean;
  handleCardClick: (card: any, index: number) => void;
}) {
  return (
    <>
      <section className="flex flex-row justify-center gap-8">
        {player_obj?.hand?.map((card: any, index: number) => (
          <div key={index}>
            {show_cards ? (
              <Tooltip
                placement="bottom"
                label={`${card.name} \n
                          ${card.description} \n
                          A:${card.attack} D:${card.defense}`}
              >
                <button
                  onClick={() => handleCardClick(card, index)}
                  className="inline-flex"
                  disabled={isWaitingForAttack}
                >
                  <img
                    className="h-40 py-2 w-auto hover:border-red-600"
                    src="/images/cards/front.png"
                    alt="shark"
                  />
                </button>
              </Tooltip>
            ) : (
              <img
                className="h-40 py-2 w-auto"
                src="/images/cards/back.jpeg"
                alt="shark"
              />
            )}
          </div>
        ))}
      </section>
    </>
  );
}
