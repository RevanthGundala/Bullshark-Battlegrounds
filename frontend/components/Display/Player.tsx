import { Image, Tooltip } from "@chakra-ui/react";
import Hand from "./Hand";

export default function Player({
  player_num,
  player_obj,
}: {
  player_num: number;
  player_obj: any;
}) {
  return (
    <>
      {player_num === 1 ? (
        <div>
          <Tooltip
            placement="top"
            label={`Health: ${player_obj?.life || "Loading..."}`}
          >
            <Image
              className="rounded-full h-32 w-auto"
              src="/images/player1.png"
              alt="player-1"
            />
          </Tooltip>
        </div>
      ) : (
        <div>
          <Tooltip
            placement="bottom"
            label={`Health: ${player_obj?.life || "Loading..."}`}
          >
            <Image
              className="rounded-full h-32 w-auto"
              src="/images/player2.png"
              alt="player-2"
            />
          </Tooltip>
        </div>
      )}
    </>
  );
}
