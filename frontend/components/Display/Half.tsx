import React from "react";
import Area from "./Area";
import Hand from "./Hand";
import Board from "./Board";

export default function Half({
  player_num,
  player_obj,
  isWaitingForAttack,
  show_cards,
  opponent_perspective,
  handleCardClick,
}: {
  player_num: number;
  player_obj: any;
  isWaitingForAttack: boolean;
  show_cards: boolean;
  opponent_perspective: boolean;
  handleCardClick: (card: any, index: number) => void;
}) {
  return (
    <>
      {opponent_perspective ? (
        <>
          <section className="w-full pt-8 pb-12 px-4">
            <Area
              opponent_perspective={true}
              player_num={player_num}
              player_obj={player_obj}
            />
            <Hand
              player_obj={player_obj}
              isWaitingForAttack={isWaitingForAttack}
              show_cards={show_cards}
              handleCardClick={handleCardClick}
            />
          </section>
          <section className="w-fullp-16">
            <Board
              player_obj={player_obj}
              isWaitingForAttack={isWaitingForAttack}
              handleCardClick={handleCardClick}
            />
          </section>
        </>
      ) : (
        <>
          <section className="w-full p-16">
            <Board
              player_obj={player_obj}
              isWaitingForAttack={isWaitingForAttack}
              handleCardClick={handleCardClick}
            />
          </section>
          <section className="w-fullpt-8 pb-12 px-4">
            <Hand
              player_obj={player_obj}
              isWaitingForAttack={isWaitingForAttack}
              show_cards={show_cards}
              handleCardClick={handleCardClick}
            />
            <Area
              opponent_perspective={false}
              player_num={player_num}
              player_obj={player_obj}
            />
          </section>
        </>
      )}
    </>
  );
}
