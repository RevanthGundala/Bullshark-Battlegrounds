import { Image, Tooltip, Button } from "@chakra-ui/react";

export default function Board({
  player_obj,
  isWaitingForAttack,
  handleCardClick,
}: {
  player_obj: any;
  isWaitingForAttack: boolean;
  handleCardClick: (card: any, index: number) => void;
}) {
  return (
    <>
      <section className="flex flex-row justify-center gap-8">
        {player_obj?.board?.map((card: any, index: number) => (
          <div key={index}>
            <Tooltip
              placement="bottom"
              label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
            >
              <button
                onClick={() => handleCardClick(card, index)}
                className="inline-flex"
                disabled={!isWaitingForAttack}
              >
                <img
                  className="h-40 w-auto hover:border-red-600"
                  src="/images/cards/front.png"
                  alt="shark"
                />
              </button>
            </Tooltip>
          </div>
        ))}
      </section>
    </>
  );
}
