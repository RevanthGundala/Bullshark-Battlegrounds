import {
  Box,
  Text,
  VStack,
  Spinner,
  Modal,
  ModalBody,
  ModalFooter,
  ModalOverlay,
  ModalContent,
  Button,
  ModalHeader,
  ModalCloseButton,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { NextRouter, useRouter } from "next/router";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ethos,
  TransactionBlock,
  SignInButton,
  Wallet,
  EthosConnectStatus,
} from "ethos-connect";
import { GetServerSideProps } from "next";
import {
  MAX_HAND_SIZE,
  MODULE_ADDRESS,
  STARTING_DECK_SIZE,
  TOTAL_DECK_SIZE,
} from "../constants/index";
import { accept_challenge, draw } from "../calls/move_calls";
// import { useSuiProvider } from "@suiet/wallet";
import LoadingGame from "./LoadingGame";

interface PlayerContract {
  fields: {
    addr: string;
    board: string[];
    deck_commitment: string;
    deck_size: number;
    graveyard: string[];
    hand_commitment: string;
    hand_size: number;
    id: string;
    life: number;
  };
}

interface PlayerBackend {
  address: string;
  hand: string[];
  deck: string[];
}

interface id {
  id: string;
}

export default function Challenges() {
  const { wallet, provider } = ethos.useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const create_game = async (
    player_2_address: string,
    player_1_address: string
  ) => {
    try {
      setIsLoading(true);
      // when someone calls create_game, I know that p2 is the accepter, and p1 owns the object
      let player_1: PlayerBackend = {
        address: player_1_address,
        hand: [],
        deck: [],
      };

      let player_2: PlayerBackend = {
        address: player_2_address,
        hand: [],
        deck: [],
      };
      let nfts = wallet?.contents?.nfts;
      let owned_objects;
      let id: id;

      console.log("if");
      if (player_2_address === wallet?.address) {
        nfts?.forEach((nft) => {
          if (
            nft !== undefined &&
            nft.type === `${MODULE_ADDRESS}::card_game::Card` &&
            typeof nft.fields?.id === "object"
          ) {
            id = nft.fields?.id as id;
            player_2.deck.push(id.id);
          }
        });
        player_2.deck.slice(0, TOTAL_DECK_SIZE);

        // logic if we are player 1
        owned_objects = await provider?.getOwnedObjects({
          owner: player_1_address,
          options: { showType: true },
        });
        const filteredNfts = owned_objects?.data.filter((nft) => {
          return (
            nft !== undefined &&
            nft?.data?.type === `${MODULE_ADDRESS}::card_game::Card`
          );
        });
        // console.log("p1 filtered obj: " + JSON.stringify(filteredNfts, null, 2));
        filteredNfts?.forEach((nft) => {
          player_1.deck.push(nft.data?.objectId || "");
        });
        player_1.deck.slice(0, TOTAL_DECK_SIZE);
      }
      console.log("after if");
      // move cards from deck to hand in random way
      // todo: swtich from math.rand() -> DRAND
      while (player_1.hand.length < MAX_HAND_SIZE) {
        let index: number = Math.floor(Math.random() * TOTAL_DECK_SIZE);
        if (player_1.deck[index] !== undefined) {
          player_1.hand.push(player_1.deck[index]);
        }
        player_1.deck.splice(index, 1);
      }
      while (player_2.hand.length < MAX_HAND_SIZE) {
        let index: number = Math.floor(Math.random() * TOTAL_DECK_SIZE);
        if (player_2.deck[index] !== undefined) {
          player_2.hand.push(player_2.deck[index]);
        }
        player_2.deck.splice(index, 1);
      }
      // get card objects from ids
      player_1.deck.map(async (id: string) => {
        (await provider?.getObject({ id: id, options: { showContent: true } }))
          ?.data?.content;
      });

      player_1.hand.map(async (id: string) => {
        (await provider?.getObject({ id: id, options: { showContent: true } }))
          ?.data?.content;
      });

      player_2.deck.map(async (id: string) => {
        (await provider?.getObject({ id: id, options: { showContent: true } }))
          ?.data?.content;
      });

      player_2.hand.map(async (id: string) => {
        (await provider?.getObject({ id: id, options: { showContent: true } }))
          ?.data?.content;
      });
      console.log("before post request");
      const response = await fetch("http://localhost:5002/api/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_1: player_1,
          player_2: player_2,
        }),
      });
      if (!response.ok) {
        throw new Error(response.status.toString());
      }
      const result = await response.text();
      console.log(result);
      console.log("game created");
      setIsLoading(false);
    } catch (err) {
      console.log(err);
    }
  };

  function findMatch() {
    console.log("Find match called");
    let games = wallet?.contents?.objects.filter(
      (obj) => obj.type === `${MODULE_ADDRESS}::card_game::Game`
    );
    if (games !== undefined && games.length > 0) {
      console.log("Loading game...");
      return <LoadingGame game_id={games?.[0].objectId} isModalOpen={true} />;
    } else {
      return <div>No games found</div>;
    }
  }

  const visibleChallenges = useMemo(
    () =>
      wallet?.contents?.objects?.filter(
        (obj) => obj.type === `${MODULE_ADDRESS}::card_game::Challenge`
      ),
    [wallet?.contents?.objects]
  );

  const visibleGames = useMemo(() => findMatch(), [wallet?.contents?.objects]);

  return (
    <Box textAlign="center">
      <Text fontSize="4xl" fontWeight="bold" mt={4}>
        Challenges
      </Text>
      <Box>
        <VStack spacing="20px">
          {isLoading ? (
            <Box>
              <Spinner size="xl" />
              <Text fontWeight={"bold"}>Searching...</Text>
            </Box>
          ) : (
            <Box>
              {visibleChallenges?.map((challenge: any, index) => (
                <Button
                  key={index}
                  onClick={async () => {
                    let game_id = await accept_challenge(
                      wallet,
                      challenge.objectId
                    );
                    if (wallet && game_id) {
                      console.log("creating game");
                      await create_game(
                        wallet.address,
                        challenge.fields.challenger
                      );

                      console.log("game_id: ", game_id);
                      router.push("/game/" + game_id);
                    }
                  }}
                >
                  <Text fontWeight={"bold"}>
                    Challenger:{" "}
                    {ethos.truncateMiddle(challenge.fields.challenger, 4)}
                  </Text>
                  <br />
                </Button>
              ))}
            </Box>
          )}
        </VStack>
        <Box>{visibleGames}</Box>
      </Box>
    </Box>
  );
}
