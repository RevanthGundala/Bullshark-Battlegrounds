import React from "react";
import { Image } from "@chakra-ui/react";

export default function Graveyard({ player_obj }: { player_obj: any }) {
  return (
    <div>
      {player_obj && player_obj.graveyard && player_obj.graveyard.length > 0 ? (
        <Image
          className="h-32 w-auto"
          src="/images/cards/front.png"
          alt="graveyard"
        />
      ) : (
        <Image className="h-32 w-auto" />
      )}
    </div>
  );
}
