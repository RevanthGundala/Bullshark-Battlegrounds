import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Center,
  Container,
  Image,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  GridItem,
  Tooltip,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ethos, EthosConnectStatus, TransactionBlock } from "ethos-connect";
import {
  MODULE_ADDRESS,
  MAX_HAND_SIZE,
  STARTING_DECK_SIZE,
} from "../../../constants/index";
import {
  draw,
  discard,
  play,
  attack,
  Proof,
  surrender,
  end_turn,
} from "../../../calls/move_calls";
import { get_object_ids } from "../../../calls/api_calls";
import State from "../../../components/State";

export default function GamePage() {
  const { wallet, provider } = ethos.useWallet();

  const [isDisabled, setIsDisabled] = useState(true);
  const [isWaitingForDiscard, setIsWaitingForDiscard] =
    useState<boolean>(false);
  const [isWaitingForPlay, setIsWaitingForPlay] = useState(false);
  const [isWaitingForAttack, setIsWaitingForAttack] = useState(false);

  const [is_player_1, setIs_player_1] = useState(false);
  const [is_player_1_turn, setIs_player_1_turn] = useState(false);

  const [player_1, setPlayer_1] = useState<PlayerObject>();
  const [player_2, setPlayer_2] = useState<PlayerObject>();

  const [directPlayerAttacks, setDirectPlayerAttacks] = useState<number>(0);

  const [selected_cards_to_attack, setSelected_cards_to_attack] = useState<
    Card[] | null
  >(null);
  const [selected_cards_to_defend, setSelected_cards_to_defend] = useState<
    Card[] | null
  >(null);

  const router = useRouter();

  interface PlayerObject {
    address: string;
    board: Card[] | undefined;
    deck_commitment: string;
    deck_size: number;
    graveyard: Card[] | undefined;
    hand_commitment: string;
    hand_size: number;
    id: string;
    life: number;
    deck: Card[] | undefined;
    hand: Card[] | undefined;
  }

  interface PlayerBackend {
    address: string;
    hand: string[];
    deck: string[];
  }

  type Card = {
    id: string;
    name: string;
    description: string;
    attack: string;
    defense: string;
  };

  async function game_start() {
    const response = await fetch("http://localhost:5002/api/get", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const players = await response.json();
    let p1_addr = players.player_1.address;
    let p2_addr = players.player_2.address;

    setIs_player_1(p1_addr === wallet?.address);
    setIs_player_1_turn(p1_addr === wallet?.address);

    // 1. fetch game struct
    let objects;
    let game_objects;
    let game;
    if (is_player_1_turn) {
      // get game struct from player 1
      objects = await provider?.getOwnedObjects({
        owner: p1_addr !== undefined ? p1_addr : "",
        options: {
          showType: true,
          showContent: true,
        },
      });
    } else {
      // get game struct from player 2
      objects = await provider?.getOwnedObjects({
        owner: p2_addr !== undefined ? p2_addr : "",
        options: {
          showType: true,
          showContent: true,
        },
      });
    }

    game_objects = objects?.data?.filter(
      (object) => object.data?.type === `${MODULE_ADDRESS}::card_game::Game`
    );
    game = game_objects?.find(
      (object) => object.data?.objectId === (router.query.game_id as string)
    );

    let p1_contract;
    let p2_contract;
    if (game) {
      if (
        game.data?.content &&
        "fields" in game.data?.content &&
        game.data?.content?.fields
      ) {
        p1_contract = game.data.content.fields.player_1.fields;
        // console.log(JSON.stringify(p1_contract, null, 2));
        p2_contract = game.data.content.fields.player_2.fields;
      }

      players.player_1.deck.forEach(async (id: string) => {
        let card: any = (
          await provider?.getObject({ id: id, options: { showContent: true } })
        )?.data?.content;
        player_1?.deck?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      });

      players.player_1.hand.forEach(async (id: string) => {
        let card: any = (
          await provider?.getObject({ id: id, options: { showContent: true } })
        )?.data?.content;
        player_1?.hand?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      });

      players.player_2.deck.forEach(async (id: string) => {
        let card: any = (
          await provider?.getObject({ id: id, options: { showContent: true } })
        )?.data?.content;
        player_2?.deck?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      });

      players.player_2.hand.forEach(async (id: string) => {
        let card: any = (
          await provider?.getObject({ id: id, options: { showContent: true } })
        )?.data?.content;
        player_2?.hand?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      });

      // fill in struct fields for each player
      if (p1_contract && p2_contract) {
        let player1: PlayerObject = {
          address: p1_addr,
          board: p1_contract?.board || [],
          deck_commitment: p1_contract?.deck_commitment || "",
          deck_size: p1_contract?.deck_size,
          graveyard: p1_contract?.graveyard || [],
          hand_commitment: p1_contract?.hand_commitment,
          hand_size: p1_contract.hand_size,
          id: p1_contract.id.id,
          life: p1_contract.life,
          deck: player_1?.deck || [],
          hand: player_1?.hand || [],
        };
        let player2: PlayerObject = {
          address: p2_addr,
          board: p2_contract?.board || [],
          deck_commitment: p2_contract.deck_commitment,
          deck_size: p2_contract.deck_size,
          graveyard: p2_contract?.graveyard || [],
          hand_commitment: p2_contract.hand_commitment,
          hand_size: p2_contract.hand_size,
          id: p2_contract.id.id,
          life: p2_contract.life,
          deck: player_2?.deck || [],
          hand: player_2?.hand || [],
        };

        setPlayer_1(player1);
        setPlayer_2(player2);
        console.log("p1 " + JSON.stringify(player_1, null, 2));
        console.log("p2 " + JSON.stringify(player_2, null, 2));
      }
    }
  }

  async function update_board_state() {
    // get fields from backend
    const response = await fetch("http://localhost:5002/api/get", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const players = await response.json();
    let p1_addr = players.player_1.address;
    let p2_addr = players.player_2.address;
    // get rest of fields from contract

    // 1. fetch game struct
    let objects;
    let game_objects;
    let game;
    if (is_player_1_turn) {
      // get game struct from player 1
      objects = await provider?.getOwnedObjects({
        owner: p1_addr !== undefined ? p1_addr : "",
        options: {
          showType: true,
          showContent: true,
        },
      });
    } else {
      // get game struct from player 2
      objects = await provider?.getOwnedObjects({
        owner: p2_addr !== undefined ? p2_addr : "",
        options: {
          showType: true,
          showContent: true,
        },
      });
    }

    game_objects = objects?.data?.filter(
      (object) => object.data?.type === `${MODULE_ADDRESS}::card_game::Game`
    );
    game = game_objects?.find(
      (object) => object.data?.objectId === (router.query.game_id as string)
    );

    let p1_contract;
    let p2_contract;
    if (game) {
      if (
        game.data?.content &&
        "fields" in game.data?.content &&
        game.data?.content?.fields
      ) {
        p1_contract = game.data.content.fields.player_1.fields;
        // console.log(JSON.stringify(p1_contract, null, 2));
        p2_contract = game.data.content.fields.player_2.fields;
      }
    }

    players.player_1.deck.forEach(async (id: string) => {
      let card: any = (
        await provider?.getObject({ id: id, options: { showContent: true } })
      )?.data?.content;

      if (!player_1?.deck?.find((card: Card) => card.id === id)) {
        player_1?.deck?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      }
    });

    players.player_1.hand.forEach(async (id: string) => {
      let card: any = (
        await provider?.getObject({ id: id, options: { showContent: true } })
      )?.data?.content;
      if (!player_1?.hand?.find((card: Card) => card.id === id)) {
        player_1?.hand?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      }
    });

    players.player_2.deck.forEach(async (id: string) => {
      let card: any = (
        await provider?.getObject({ id: id, options: { showContent: true } })
      )?.data?.content;
      if (!player_2?.deck?.find((card: Card) => card.id === id)) {
        player_2?.deck?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      }
    });

    players.player_2.hand.forEach(async (id: string) => {
      let card: any = (
        await provider?.getObject({ id: id, options: { showContent: true } })
      )?.data?.content;
      if (!player_2?.hand?.find((card: Card) => card.id === id)) {
        player_2?.hand?.push({
          id: card.fields.id.id,
          name: card.fields.name,
          description: card.fields.description,
          attack: card.fields.type.fields.attack,
          defense: card.fields.type.fields.defense,
        });
      }
    });

    // fill in struct fields for each player
    if (p1_contract && p2_contract) {
      let player1: PlayerObject = {
        address: p1_addr,
        board: p1_contract?.board || [],
        deck_commitment: p1_contract?.deck_commitment || "",
        deck_size: p1_contract?.deck_size,
        graveyard: p1_contract?.graveyard || [],
        hand_commitment: p1_contract?.hand_commitment,
        hand_size: p1_contract.hand_size,
        id: p1_contract.id.id,
        life: p1_contract.life,
        deck: player_1?.deck || [],
        hand: player_1?.hand || [],
      };
      let player2: PlayerObject = {
        address: p2_addr,
        board: p2_contract?.board || [],
        deck_commitment: p2_contract.deck_commitment,
        deck_size: p2_contract.deck_size,
        graveyard: p2_contract?.graveyard || [],
        hand_commitment: p2_contract.hand_commitment,
        hand_size: p2_contract.hand_size,
        id: p2_contract.id.id,
        life: p2_contract.life,
        deck: player_2?.deck || [],
        hand: player_2?.hand || [],
      };

      setPlayer_1(player1);
      setPlayer_2(player2);
      console.log("p1 updated: " + JSON.stringify(player_1, null, 2));
      console.log("p2 updated: " + JSON.stringify(player_2, null, 2));
    }
  }

  async function handleCardClick(card: Card) {
    if (isWaitingForDiscard) {
      await discard_card(card);
    } else if (isWaitingForPlay) {
      await play_card(card);
    } else if (isWaitingForAttack) {
      // if card belongs to player 1 -> attacking
      if (selected_cards_to_attack?.includes(card)) {
        selected_cards_to_attack?.push(card);
      } else {
        selected_cards_to_defend?.push(card);
      }
    }
  }

  async function discard_card(card: Card) {
    if (isWaitingForDiscard) {
      if (player_1 && player_2) {
        let player1: PlayerBackend = {
          address: player_1.address,
          hand: player_1.hand?.map((card: Card) => card.id) || [],
          deck: player_1.deck?.map((card: Card) => card.id) || [],
        };
        let player2: PlayerBackend = {
          address: player_2.address,
          hand: player_2.hand?.map((card: Card) => card.id) || [],
          deck: player_2.deck?.map((card: Card) => card.id) || [],
        };

        await discard(
          wallet,
          router.query.game_id as string,
          card.id || "1",
          is_player_1,
          player1,
          player2
        );
      }
      await update_board_state();
      setIsWaitingForDiscard(false);
    }
  }

  async function play_card(card: Card) {
    if (isWaitingForPlay) {
      if (player_1 && player_2) {
        let player1: PlayerBackend = {
          address: player_1.address,
          hand: player_1.hand?.map((card: Card) => card.id) || [],
          deck: player_1.deck?.map((card: Card) => card.id) || [],
        };
        let player2: PlayerBackend = {
          address: player_2.address,
          hand: player_2.hand?.map((card: Card) => card.id) || [],
          deck: player_2.deck?.map((card: Card) => card.id) || [],
        };

        await play(
          wallet,
          router.query.game_id as string,
          card.id || "1",
          is_player_1,
          player1,
          player2
        );
      }
      await update_board_state();
      setIsWaitingForPlay(false);
    }
  }

  async function turn_logic() {
    if (is_player_1_turn) {
      if (is_player_1) {
        setIsDisabled(false);
        if (player_1 && player_2) {
          let player1: PlayerBackend = {
            address: player_1.address,
            hand: player_1.hand?.map((card: Card) => card.id) || [],
            deck: player_1.deck?.map((card: Card) => card.id) || [],
          };
          let player2: PlayerBackend = {
            address: player_2.address,
            hand: player_2.hand?.map((card: Card) => card.id) || [],
            deck: player_2.deck?.map((card: Card) => card.id) || [],
          };
          await draw(
            wallet,
            router.query.game_id as string,
            is_player_1,
            player1,
            player2
          );
          await update_board_state();
        }
        if (player_1 && player_1.hand && player_1.hand.length > MAX_HAND_SIZE) {
          setIsWaitingForDiscard(true);
        }
        if (!isWaitingForDiscard) {
          setIsWaitingForPlay(true);
        }
        if (!isWaitingForPlay) {
          setIsWaitingForAttack(true);
        }
        if (!isWaitingForAttack) {
          setIs_player_1_turn(false);
        }
      }
      // player 2 when p1s turn
      else {
        setIsDisabled(true);
      }
    }
    // player 2's turn
    else {
      if (!is_player_1) {
        setIsDisabled(false);
        if (player_1 && player_2) {
          let player1: PlayerBackend = {
            address: player_1.address,
            hand: player_1.hand?.map((card: Card) => card.id) || [],
            deck: player_1.deck?.map((card: Card) => card.id) || [],
          };
          let player2: PlayerBackend = {
            address: player_2.address,
            hand: player_2.hand?.map((card: Card) => card.id) || [],
            deck: player_2.deck?.map((card: Card) => card.id) || [],
          };
          await draw(
            wallet,
            router.query.game_id as string,
            is_player_1,
            player1,
            player2
          );
        }
        if (player_2 && player_2.hand && player_2.hand.length > MAX_HAND_SIZE) {
          setIsWaitingForDiscard(true);
        }
        if (!isWaitingForDiscard) {
          setIsWaitingForPlay(true);
        }
        if (!isWaitingForPlay) {
          setIsWaitingForAttack(true);
        }
        if (!isWaitingForAttack) {
          setIs_player_1_turn(true);
        }
      } else {
        setIsDisabled(true);
      }
    }
  }

  // useEffect(() => {
  //   console.log("Game start");
  //   game_start();
  // }, []);

  useEffect(() => {
    console.log("update board state");
    update_board_state();
  }, [is_player_1_turn]);

  useEffect(() => {
    turn_logic();
  }, [
    isWaitingForAttack,
    isWaitingForDiscard,
    isWaitingForPlay,
    is_player_1_turn,
  ]);

  return (
    <>
      {is_player_1 ? (
        <>
          {/* Logic for player 1*/}
          <div
            className={
              "min-h-screen flex flex-col items-center bg-[url('/images/lobby.png')]"
            }
          >
            {/* Main Div */}
            <div className="grid grid-rows-7 min-h-screen w-4/5 gap-2">
              {/* FIRST DIV */}
              <div className="grid grid-cols-8 w-full min-h-full bg-green-500 gap-2 p-2 ">
                <div className="w-full h-full p-2 bg-green-800 ">
                  {player_2 && player_2.hand && player_2.hand.length > 0 ? (
                    <Image src="/images/cards/back.jpeg" alt="enemy-deck" />
                  ) : (
                    <Image></Image>
                  )}
                </div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 ">
                  <Tooltip
                    placement="bottom"
                    label={`Health: ${player_2?.life || "Loading..."}`}
                  >
                    <Image src="/images/player2.png" alt="player-2" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full bg-green-500 gap-2 p-2 ">
                <div className="w-full h-full p-2 bg-green-800 "></div>
                {player_2?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-green-800">
                    <div style={{ height: "100%" }}>
                      <Image
                        src="/images/cards/back.jpeg"
                        alt="card"
                        style={{ height: "100%" }}
                      />
                    </div>
                  </div>
                ))}
                <div className="w-full h-full p-2 bg-green-800 "></div>
              </div>

              {/* Second Div */}
              <div className="h-full  grid grid-rows-7 items-center row-span-3 gap-2 ">
                <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-green-500 gap-2 p-2">
                  {player_2?.board?.map((card: Card, index: number) => (
                    <div key={index} className="w-full h-full p-2 bg-green-800">
                      <Tooltip
                        placement="bottom"
                        label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                      >
                        <Button
                          onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                          className="w-full h-full p-0 hover:border-red-500"
                          style={{
                            border: selected_cards_to_defend?.includes(card)
                              ? "2px solid red"
                              : "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                          isDisabled={!isWaitingForAttack}
                        >
                          <Image src="/images/cards/front.png" alt="shark" />
                        </Button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 min-h-full bg-orange-400 w-full items-center">
                  <div className="flex justify-center ">
                    <Button
                      colorScheme="yellow"
                      isDisabled={false ? is_player_1_turn : true}
                      onClick={() =>
                        end_turn(wallet, router.query.game_id as string)
                      }
                    >
                      End Turn
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <State
                      isWaitingForDiscard={isWaitingForDiscard}
                      isWaitingForAttack={isWaitingForAttack}
                      isWaitingForPlay={isWaitingForPlay}
                      wallet={wallet}
                      router={router}
                      selected_cards_to_attack={selected_cards_to_attack}
                      selected_cards_to_defend={selected_cards_to_defend}
                    />
                  </div>
                  <div className="flex justify-center ">
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        surrender(wallet, router.query.game_id as string);
                        router.push("/");
                      }}
                    >
                      Surrender
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-8 w-full min-h-full bg-blue-500 row-span-2 p-2 gap-2 ">
                  <div className="w-full h-full p-2 bg-blue-800 "></div>
                  {player_1?.board?.map((card: Card, index: number) => (
                    <div key={index} className="w-full h-full p-2 bg-blue-800">
                      <Tooltip
                        placement="bottom"
                        label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                      >
                        <Button
                          onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                          className="w-full h-full p-0 hover:border-red-500"
                          style={{
                            border: selected_cards_to_attack?.includes(card)
                              ? "2px solid red"
                              : "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                          isDisabled={!isWaitingForAttack}
                        >
                          <Image src="/images/cards/front.png" alt="shark" />
                        </Button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full bg-blue-500 p-2 gap-2 ">
                {player_1?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-blue-800">
                    <Tooltip
                      placement="bottom"
                      label={`Card Name: ${card.name}\n
                      Card Description: ${card.description}\n
                      Attack: ${card.attack}\n
                      Defense: ${card.defense}`}
                    >
                      <Button
                        onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                        className="w-full h-full p-0 hover:border-red-500"
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                        disabled={isWaitingForAttack}
                      >
                        <Image src="/images/cards/front.png" alt="shark" />
                      </Button>
                    </Tooltip>
                  </div>
                ))}
              </div>
              <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2">
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 ">
                  <Tooltip
                    placement="top"
                    label={`Health: ${player_1?.life || "Loading..."}`}
                  >
                    <Image src="/images/player1.png" alt="player-1" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 ">
                  {player_1 && player_1.deck && player_1.deck.length > 0 ? (
                    <Image src="/images/cards/back.jpeg" alt="your-deck" />
                  ) : (
                    <Image></Image>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Logic for player 2's turn */}
          <div
            className={
              "min-h-screen flex flex-col items-center bg-[url('/images/lobby.png')]"
            }
          >
            {/* Main Div */}
            <div className="grid grid-rows-7 min-h-screen w-4/5 gap-2">
              {/* FIRST DIV */}
              <div className="grid grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2 ">
                <div className="w-full h-full p-2 bg-blue-800 ">
                  {player_1 && player_1.hand && player_1.hand.length > 0 ? (
                    <Image src="/images/cards/back.jpeg" alt="enemy-deck" />
                  ) : (
                    <Image></Image>
                  )}
                </div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 ">
                  <Tooltip
                    placement="bottom"
                    label={`Health: ${player_1?.life || "Loading..."}`}
                  >
                    <Image src="/images/player1.png" alt="player-1" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2 ">
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                {player_1?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-blue-800">
                    <Image src="/images/cards/back.jpeg" alt="card" />
                  </div>
                ))}
                <div className="w-full h-full p-2 bg-blue-800 "></div>
              </div>
              {/* Second Div */}
              <div className="h-full  grid grid-rows-7 items-center row-span-3 gap-2 ">
                <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2">
                  {player_1?.board?.map((card: Card, index: number) => (
                    <div key={index} className="w-full h-full p-2 bg-blue-800">
                      <Tooltip
                        placement="bottom"
                        label={`Card Name: ${card.name}\n
                        Card Description: ${card.description}\n
                        Attack: ${card.attack}\n
                        Defense: ${card.defense}`}
                      >
                        <Button
                          onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                          className="w-full h-full p-0 hover:border-red-500"
                          style={{
                            border: selected_cards_to_defend?.includes(card)
                              ? "2px solid red"
                              : "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Image src="/images/cards/front.png" alt="shark" />
                        </Button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 min-h-full bg-orange-400 w-full items-center">
                  <div className="flex justify-center ">
                    <Button
                      colorScheme="yellow"
                      isDisabled={isDisabled}
                      onClick={() =>
                        end_turn(wallet, router.query.game_id as string)
                      }
                    >
                      End Turn
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <State
                      isWaitingForDiscard={isWaitingForDiscard}
                      isWaitingForAttack={isWaitingForAttack}
                      isWaitingForPlay={isWaitingForPlay}
                      wallet={wallet}
                      router={router}
                      selected_cards_to_attack={selected_cards_to_attack}
                      selected_cards_to_defend={selected_cards_to_defend}
                    />
                  </div>
                  <div className="flex justify-center ">
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        surrender(wallet, router.query.game_id as string);
                        router.push("/");
                      }}
                    >
                      Surrender
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-8 w-full min-h-full bg-green-500 row-span-2 p-2 gap-2 ">
                  {player_2?.board?.map((card: Card, index: number) => (
                    <div key={index} className="w-full h-full p-2 bg-green-800">
                      <Tooltip
                        placement="bottom"
                        label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                      >
                        <Button
                          onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                          className="w-full h-full p-0 hover:border-red-500"
                          style={{
                            border: selected_cards_to_attack?.includes(card)
                              ? "2px solid red"
                              : "none",
                            background: "none",
                            cursor: "pointer",
                          }}
                          disabled={!isWaitingForAttack}
                        >
                          <Image src="/images/cards/front.png" alt="shark" />
                        </Button>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full bg-green-500 p-2 gap-2 ">
                {player_2?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-green-800">
                    <Tooltip
                      placement="bottom"
                      label={`Card Name: ${card.name}\n
                      Card Description: ${card.description}\n
                      Attack: ${card.attack}\n
                      Defense: ${card.defense}`}
                    >
                      <Button
                        onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                        className="w-full h-full p-0 hover:border-red-500"
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                        isDisabled={isWaitingForAttack}
                      >
                        <Image src="/images/cards/front.png" alt="shark" />
                      </Button>
                    </Tooltip>
                  </div>
                ))}
              </div>
              <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-green-500 gap-2 p-2">
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 ">
                  <Tooltip
                    placement="top"
                    label={`Health: ${player_2?.life || "Loading..."}`}
                  >
                    <Image src="/images/player2.png" alt="player-2" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 ">
                  {" "}
                  {player_2 && player_2.deck && player_2.deck.length > 0 ? (
                    <Image src="/images/cards/back.jpeg" alt="your-deck" />
                  ) : (
                    <Image></Image>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      ;
    </>
  );
}
