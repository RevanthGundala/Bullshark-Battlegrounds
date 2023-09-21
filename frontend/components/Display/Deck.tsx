import React from "react";
import { Image } from "@chakra-ui/react";

export default function Deck({ player_obj }: { player_obj: any }) {
  return (
    <div>
      {player_obj && player_obj.deck && player_obj.deck.length > 0 ? (
        <Image
          className="h-32 w-auto"
          src="/images/cards/back.jpeg"
          alt="p1-deck"
        />
      ) : (
        <Image className="h-32 w-auto" />
      )}
    </div>
  );
}
