import Deck from "./Deck";
import Player from "./Player";
import Graveyard from "./Graveyard";

export default function Area({
  opponent_perspective,
  player_num,
  player_obj,
}: {
  opponent_perspective: boolean;
  player_num: number;
  player_obj: any;
}) {
  return (
    <>
      {!opponent_perspective ? (
        <section className="flex flex-row justify-around w-full">
          <Graveyard player_obj={player_obj} />
          <Player player_num={player_num} player_obj={player_obj} />
          <Deck player_obj={player_obj} />
        </section>
      ) : (
        <section className="flex flex-row justify-around w-full">
          <Deck player_obj={player_obj} />
          <Player player_num={player_num} player_obj={player_obj} />
          <Graveyard player_obj={player_obj} />
        </section>
      )}
    </>
  );
}
