import { useState, useEffect, useCallback, useMemo } from "react";
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
import State from "../../../components/State";
import { useLocalStorage } from "usehooks-ts";

export default function GamePage() {
  const { wallet, provider } = ethos.useWallet();

  const [isWaitingForDraw, setIsWaitingForDraw] = useState(false);
  const [isWaitingForDiscard, setIsWaitingForDiscard] = useState(false);
  const [isWaitingForPlay, setIsWaitingForPlay] = useState(false);
  const [isWaitingForAttack, setIsWaitingForAttack] = useState(false);

  const [is_player_1, setIs_player_1] = useState(false);
  const [is_player_1_turn, setIs_player_1_turn] = useState(true);

  const [player_1, setPlayer_1] = useState<PlayerObject>();
  const [player_2, setPlayer_2] = useState<PlayerObject>();

  const [selected_cards_to_attack, setSelected_cards_to_attack] = useState<
    number[] | null
  >([]);
  const [selected_cards_to_defend, setSelected_cards_to_defend] = useState<
    number[] | null
  >([]);

  const [p1_addr, setP1_addr] = useLocalStorage("p1_addr", "");
  const [p2_addr, setP2_addr] = useLocalStorage("p2_addr", "");

  const [game_object, setGame_object] = useState<any>();
  const [game, setGame] = useState<any>();

  const router = useRouter();

  interface Card {
    id: string;
    name: string;
    description: string;
    attack: string;
    defense: string;
    image_url: string;
  }

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

  function match_game_state() {
    console.log("Fetching game state...");
    setIsWaitingForDraw(false);
    setIsWaitingForDiscard(false);
    setIsWaitingForPlay(false);
    setIsWaitingForAttack(false);
    const state: string = game?.fields?.state;
    if (state === "10") {
      setIsWaitingForDraw(true);
    } else if (state === "11") {
      setIsWaitingForDiscard(true);
    } else if (state === "12") {
      setIsWaitingForPlay(true);
    } else if (state === "13") {
      setIsWaitingForAttack(true);
    } else {
      console.log("game state is invalid");
    }
  }

  function new_player_object(
    address: string,
    board: Card[] | undefined,
    deck_commitment: string,
    deck_sizse: number,
    graveyard: Card[] | undefined,
    hand_commitment: string,
    hand_size: number,
    id: string,
    life: number,
    deck: Card[] | undefined,
    hand: Card[] | undefined
  ): PlayerObject {
    return {
      address: address,
      board: board,
      deck_commitment: deck_commitment,
      deck_size: deck_sizse,
      graveyard: graveyard,
      hand_commitment: hand_commitment,
      hand_size: hand_size,
      id: id,
      life: life,
      deck: deck,
      hand: hand,
    };
  }

  function new_default_players(
    p1_addr: string,
    p1_contract: any,
    p2_addr: string,
    p2_contract: any
  ): any[] {
    const defaultPlayer1 = new_player_object(
      p1_addr,
      p1_contract?.board,
      p1_contract?.deck_commitment,
      p1_contract?.deck_size,
      p1_contract?.graveyard,
      p1_contract?.hand_commitment,
      p1_contract?.hand_size,
      p1_contract?.id?.id,
      p1_contract?.life,
      [],
      []
    );

    const defaultPlayer2 = new_player_object(
      p2_addr,
      p2_contract?.board,
      p2_contract?.deck_commitment,
      p2_contract?.deck_size,
      p2_contract?.graveyard,
      p2_contract?.hand_commitment,
      p2_contract?.hand_size,
      p2_contract?.id?.id,
      p2_contract?.life,
      [],
      []
    );
    return [defaultPlayer1, defaultPlayer2];
  }

  function contract_card_to_card(contract_card: any): Card | undefined {
    let res = contract_card?.fields
      ? {
          id: contract_card.fields.id.id,
          name: contract_card.fields.name,
          description: contract_card.fields.description,
          attack: contract_card.fields.type.fields.attack,
          defense: contract_card.fields.type.fields.defense,
          image_url: contract_card.fields.image_url,
        }
      : undefined;
    return res;
  }

  function get_player_backend(player: PlayerObject): PlayerBackend {
    return {
      address: player.address,
      hand: (player.hand || []).map((card: Card) => card.id),
      deck: (player.deck || []).map((card: Card) => card.id),
    };
  }

  async function update_deck(
    deck: string[],
    player: PlayerObject
  ): Promise<Card[] | undefined> {
    const deck_set: Set<string> = new Set<string>(deck);
    for (const id of Array.from(deck_set)) {
      if (id) {
        if (
          player.deck?.length === 0 ||
          !player.deck?.find(
            (player_deck_card: Card) => player_deck_card.id === id
          )
        ) {
          let contract_card: any = (
            await provider?.getObject({
              id: id,
              options: { showContent: true },
            })
          )?.data?.content;
          let card = contract_card_to_card(contract_card);
          card ? player.deck?.push(card) : undefined;
        }
      }
    }

    player.deck = player.deck?.filter((card) => deck_set.has(card.id)) || [];
    return player.deck;
  }

  async function update_hand(
    hand: string[],
    player: PlayerObject
  ): Promise<Card[] | undefined> {
    // convert id to Card type
    // make sure we dont already have the card
    const hand_set: Set<string> = new Set<string>(hand);
    for (const id of Array.from(hand_set)) {
      if (id) {
        if (
          player.hand?.length === 0 ||
          !player.hand?.find(
            (player_hand_card: Card) => player_hand_card.id === id
          )
        ) {
          let contract_card: any = (
            await provider?.getObject({
              id: id,
              options: { showContent: true },
            })
          )?.data?.content;
          let card = contract_card_to_card(contract_card);
          card ? player.hand?.push(card) : undefined;
        }
      }
    }
    player.hand = player.hand?.filter((card) => hand_set.has(card.id)) || [];
    return player.hand;
  }

  async function handleCardClick(card: Card | undefined, index: number) {
    if (!card || !player_1 || !player_2) return;
    let player = is_player_1_turn
      ? get_player_backend(player_1)
      : get_player_backend(player_2);
    if (isWaitingForDiscard) {
      console.log("Discarding...");
      await discard(
        wallet,
        router.query.game_id as string,
        card.id,
        is_player_1,
        player
      );
    } else if (isWaitingForPlay) {
      console.log("Playing...");
      await play(
        wallet,
        router.query.game_id as string,
        card.id || "1",
        is_player_1,
        player
      );
    } else if (isWaitingForAttack) {
      // if card belongs to player 1 -> attacking
      if (
        (player_1?.board?.includes(card) && is_player_1) ||
        (player_2?.board?.includes(card) && !is_player_1)
      ) {
        if (!selected_cards_to_attack?.includes(index)) {
          selected_cards_to_attack?.push(index);
        }
        console.log("Attacking: " + selected_cards_to_attack?.length);
      } else {
        if (!selected_cards_to_defend?.includes(index)) {
          selected_cards_to_defend?.push(index);
        }
        console.log("Defending: " + selected_cards_to_defend);
      }
    } else {
      console.log("Card clicked and not your turn");
    }
  }
  // TODO: Game needs to be refreshed manually to update state changes
  // this func wont be called for the opponent player
  setInterval(async () => {
    const obj = await get_game_object();
    setGame_object(obj);
    // Do something with the game object if needed
  }, 5000); // 5000 milliseconds = 5 seconds
  async function get_game_object(): Promise<any> {
    try {
      return await provider?.getObject({
        id: router.query.game_id as string,
        options: { showContent: true, showOwner: true },
      });
    } catch (err) {
      console.log(err);
    }
  }
  useEffect(() => {
    let updating = true;
    update_board_state();
    // if (player_1 && player_2) {
    //   turn_logic();
    // }
    return () => {
      updating = false;
    };

    // first render, it will be player 1 turn
    async function update_board_state() {
      if (!updating || !provider) {
        console.log("Not updating board state");
        return;
      }
      try {
        console.log("Updating board state...");
        const response = await fetch("http://localhost:5002/api/get", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const players = await response.json();
        setP1_addr(players.player_1.address);
        setP2_addr(players.player_2.address);
        setIs_player_1(p1_addr === wallet?.address);
        let game_content = game_object?.data?.content;
        JSON.stringify(game_content) !== JSON.stringify(game)
          ? setGame(game_content)
          : undefined;
        if (!game) {
          console.log("game is undefined, cant update state");
          return;
        }
        p1_addr === game_object?.data?.owner.AddressOwner
          ? setIs_player_1_turn(true)
          : setIs_player_1_turn(false);
        match_game_state();
        let p1_contract = game.fields.player_1.fields;
        let p2_contract = game.fields.player_2.fields;
        let currentPlayer1, currentPlayer2;
        if (!player_1 || !player_2) {
          [currentPlayer1, currentPlayer2] = new_default_players(
            p1_addr,
            p1_contract,
            p2_addr,
            p2_contract
          );
        } else {
          currentPlayer1 = player_1;
          currentPlayer2 = player_2;
        }
        let p1_deck = await update_deck(players.player_1.deck, currentPlayer1);
        let p1_hand = await update_hand(players.player_1.hand, currentPlayer1);
        let p2_deck = await update_deck(players.player_2.deck, currentPlayer2);
        let p2_hand = await update_hand(players.player_2.hand, currentPlayer2);

        let player1: PlayerObject = new_player_object(
          p1_addr,
          p1_contract?.board.map((contract_card: any) =>
            contract_card_to_card(contract_card)
          ),
          p1_contract?.deck_commitment,
          p1_contract?.deck_size,
          p1_contract?.graveyard.map((contract_card: any) =>
            contract_card_to_card(contract_card)
          ),
          p1_contract?.hand_commitment,
          p1_contract?.hand_size,
          p1_contract?.id?.id,
          p1_contract?.life,
          p1_deck,
          p1_hand
        );

        let player2: PlayerObject = new_player_object(
          p2_addr,
          p2_contract?.board.map((contract_card: any) =>
            contract_card_to_card(contract_card)
          ),
          p2_contract?.deck_commitment,
          p2_contract?.deck_size,
          p2_contract?.graveyard.map((contract_card: any) =>
            contract_card_to_card(contract_card)
          ),
          p2_contract?.hand_commitment,
          p2_contract?.hand_size,
          p2_contract?.id?.id,
          p2_contract?.life,
          p2_deck,
          p2_hand
        );
        if (!player_1 || !player_2) {
          setPlayer_1(player1);
          setPlayer_2(player2);
        } else {
          JSON.stringify(player_1) !== JSON.stringify(player1)
            ? setPlayer_1(player1)
            : undefined;
          JSON.stringify(player_2) !== JSON.stringify(player2)
            ? setPlayer_2(player2)
            : undefined;
        }
        console.log("Finished updating board state...");
      } catch (err) {
        console.log(err);
      }
    }

    async function turn_logic() {
      try {
        if (!updating) {
          console.log("Not updating turn logic");
          return;
        }
        console.log("Updating turn logic...");
        let player =
          is_player_1_turn && is_player_1 && player_1
            ? get_player_backend(player_1)
            : !is_player_1_turn && !is_player_1 && player_2
            ? get_player_backend(player_2)
            : undefined;

        player && isWaitingForDraw
          ? draw(wallet, router.query.game_id as string, is_player_1, player)
          : undefined;
      } catch (error) {
        console.log(error);
      }
    }
  }, [
    is_player_1_turn,
    game,
    player_1,
    player_2,
    router.query.game_id,
    provider,
    wallet?.contents?.nfts,
  ]);

  return (
    <>
      {is_player_1 ? (
        <>
          {/* Logic for player 1*/}
          <div
            className={
              "min-h-screen flex flex-col items-center laptop:bg-[url('/images/map.png')]"
            }
          >
            {/* Main Div */}
            <div className="grid grid-rows-7 min-h-screen w-4/5 gap-2">
              {/* FIRST DIV */}
              <div className="grid grid-cols-8 w-full min-h-ful gap-2 p-2 ">
                <div className="w-full h-full p-2  ">
                  {player_2 && player_2.hand && player_2.hand.length > 0 ? (
                    <Image
                      src="/images/cards/back.jpeg"
                      alt="card"
                      style={{ width: "100px", height: "auto" }}
                    />
                  ) : (
                    <Image></Image>
                  )}
                </div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2 ">
                  <Tooltip
                    placement="bottom"
                    label={`Health: ${player_2?.life || "Loading..."}`}
                  >
                    <Image src="/images/player2.png" alt="player-2" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2 ">
                  {player_2 &&
                  player_2.graveyard &&
                  player_2.graveyard.length > 0 ? (
                    <Image
                      src="/images/cards/front.png"
                      alt="enemy-deck"
                      style={{ width: "100px", height: "auto" }}
                    />
                  ) : (
                    <Image></Image>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full gap-2 p-2 ">
                <div className="w-full h-full p-2 "></div>
                {player_2?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 ">
                    <Image
                      src="/images/cards/back.jpeg"
                      alt="card"
                      style={{ width: "100px", height: "auto" }}
                    />
                  </div>
                ))}
                <div className="w-full h-full p-2 "></div>
              </div>

              {/* Second Div */}
              <div className="h-full  grid grid-rows-7 items-center row-span-3 gap-2 ">
                <div className="grid row-span-2 grid-cols-8 w-full min-h-full gap-2 p-2">
                  {player_2?.board?.map((card: Card, index: number) => (
                    <div key={index} className="w-full h-full p-2">
                      <Tooltip
                        placement="bottom"
                        label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                      >
                        <Button
                          onClick={() => handleCardClick(card, index)} // Replace with your onClick handler function
                          className="w-full h-full p-0 hover:border-red-500"
                          style={{
                            border: isWaitingForAttack
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
                      isDisabled={is_player_1_turn ? false : true}
                      onClick={() =>
                        end_turn(wallet, router.query.game_id as string)
                      }
                    >
                      End Turn
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <State
                      isWaitingForDraw={isWaitingForDraw}
                      isWaitingForDiscard={isWaitingForDiscard}
                      isWaitingForAttack={isWaitingForAttack}
                      isWaitingForPlay={isWaitingForPlay}
                      wallet={wallet}
                      router={router}
                      selected_cards_to_attack={selected_cards_to_attack}
                      selected_cards_to_defend={selected_cards_to_defend}
                      is_player_1={is_player_1}
                      is_player_1_turn={is_player_1_turn}
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

                <div className="grid grid-cols-8 w-full min-h-full row-span-2 p-2 gap-2 ">
                  <div className="w-full h-full p-2 "></div>
                  {player_1?.board?.map((card: Card, index: number) => {
                    return (
                      <div key={index} className="w-full h-full p-2">
                        <Tooltip
                          placement="bottom"
                          label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                        >
                          <Button
                            onClick={() => handleCardClick(card, index)} // Replace with your onClick handler function
                            className="w-full h-full p-0 hover:border-red-500"
                            style={{
                              border: isWaitingForAttack
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
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full p-2 gap-2 ">
                <div></div>
                {player_1?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-white">
                    <Tooltip
                      placement="bottom"
                      label={`${card.name} \n
                        ${card.description} \n
                        A:${card.attack} D:${card.defense}`}
                    >
                      <Button
                        onClick={() => handleCardClick(card, index)} // Replace with your onClick handler function
                        className="w-full h-full"
                        style={{
                          height: "80px",
                          width: "80px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                        disabled={isWaitingForAttack}
                      >
                        <Box
                          _hover={{ backgroundColor: "#ebedf0" }} // Hover effect for the Box
                        >
                          <Image src="/images/cards/front.png" alt="shark" />
                        </Box>
                      </Button>
                    </Tooltip>
                  </div>
                ))}
              </div>
              <div className="grid row-span-2 grid-cols-8 w-full min-h-full gap-2 p-2">
                <div className="w-full h-full p-2  ">
                  {player_1 &&
                  player_1.graveyard &&
                  player_1.graveyard.length > 0 ? (
                    <Image
                      src="/images/cards/front.png"
                      alt="card"
                      style={{
                        width: "100px",
                        height: "auto",
                        marginTop: "50px",
                      }}
                    />
                  ) : (
                    <Image></Image>
                  )}
                </div>
                <div className="w-full h-full p-2  "></div>
                <div className="w-full h-full p-2  "></div>
                <div className="w-full h-full p-2 mt-20 mb-5">
                  <Tooltip
                    placement="top"
                    label={`Health: ${player_1?.life || "Loading..."}`}
                  >
                    <Image src="/images/player1.png" alt="player-1" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2">
                  {player_1 && player_1.deck && player_1.deck.length > 0 ? (
                    <Image
                      src="/images/cards/back.jpeg"
                      alt="card"
                      style={{
                        width: "100px",
                        height: "auto",
                        marginTop: "50px",
                      }}
                    />
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
              "min-h-screen flex flex-col items-center laptop:bg-[url('/images/map.png')]"
            }
          >
            {/* Main Div */}
            <div className="grid grid-rows-7 min-h-screen w-4/5 gap-2">
              {/* FIRST DIV */}
              <div className="grid grid-cols-8 w-full min-h-ful gap-2 p-2 ">
                <div className="w-full h-full p-2  ">
                  {player_1 && player_1.deck && player_1.deck.length > 0 ? (
                    <Image
                      src="/images/cards/back.jpeg"
                      alt="enemy-deck"
                      style={{ width: "100px", height: "auto" }}
                    />
                  ) : (
                    <Image></Image>
                  )}
                </div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2">
                  <Tooltip
                    placement="bottom"
                    label={`Health: ${player_1?.life || "Loading..."}`}
                  >
                    <Image src="/images/player1.png" alt="player-1" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2">
                  {player_1 &&
                  player_1.graveyard &&
                  player_1.graveyard.length > 0 ? (
                    <Image
                      src="/images/cards/front.png"
                      alt="enemy-deck"
                      style={{ width: "100px", height: "auto" }}
                    />
                  ) : (
                    <Image></Image>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-fullgap-2 p-2 ">
                <div className="w-full h-full p-2 "></div>
                {player_1?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2">
                    <Image
                      src="/images/cards/back.jpeg"
                      alt="card"
                      style={{ width: "100px", height: "auto" }}
                    />
                  </div>
                ))}
                <div className="w-full h-full p-2"></div>
              </div>
              {/* Second Div */}
              <div className="h-full  grid grid-rows-7 items-center row-span-3 gap-2 ">
                <div className="grid row-span-2 grid-cols-8 w-full min-h-full gap-2 p-2">
                  {player_1?.board?.map((card: Card, index: number) => (
                    <div key={index} className="w-full h-full p-2">
                      <Tooltip
                        placement="bottom"
                        label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                      >
                        <Button
                          onClick={() => handleCardClick(card, index)} // Replace with your onClick handler function
                          className="w-full h-full p-0 hover:border-red-500"
                          style={{
                            border: isWaitingForAttack
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
                      isDisabled={is_player_1_turn ? true : false}
                      onClick={() =>
                        end_turn(wallet, router.query.game_id as string)
                      }
                    >
                      End Turn
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <State
                      isWaitingForDraw={isWaitingForDraw}
                      isWaitingForDiscard={isWaitingForDiscard}
                      isWaitingForAttack={isWaitingForAttack}
                      isWaitingForPlay={isWaitingForPlay}
                      wallet={wallet}
                      router={router}
                      selected_cards_to_attack={selected_cards_to_attack}
                      selected_cards_to_defend={selected_cards_to_defend}
                      is_player_1={is_player_1}
                      is_player_1_turn={is_player_1_turn}
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

                <div className="grid grid-cols-8 w-full min-h-full first-line:row-span-2 p-2 gap-2 ">
                  {player_2?.board?.map((card: Card, index: number) => {
                    return (
                      <div key={index} className="w-full h-full p-2 ">
                        <Tooltip
                          placement="bottom"
                          label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                        >
                          <Button
                            onClick={() => handleCardClick(card, index)} // Replace with your onClick handler function
                            className="w-full h-full p-0 hover:border-red-500"
                            style={{
                              border: isWaitingForAttack
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
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-fullp-2 gap-2 ">
                {player_2?.hand?.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-white">
                    <Tooltip
                      placement="bottom"
                      label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                    >
                      <Button
                        onClick={() => handleCardClick(card, index)} // Replace with your onClick handler function
                        className="w-full h-full p-0"
                        style={{
                          height: "80px",
                          width: "80px",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                        disabled={isWaitingForAttack}
                      >
                        <Box
                          _hover={{ backgroundColor: "#ebedf0" }} // Hover effect for the Box
                        >
                          <Image src="/images/cards/front.png" alt="shark" />
                        </Box>
                      </Button>
                    </Tooltip>
                  </div>
                ))}
              </div>
              <div className="grid row-span-2 grid-cols-8 w-full min-h-full gap-2 p-2">
                <div className="w-full h-full p-2  ">
                  {player_2 &&
                  player_2.graveyard &&
                  player_2.graveyard.length > 0 ? (
                    <Image
                      src="/images/cards/front.png"
                      alt="card"
                      style={{
                        width: "100px",
                        height: "auto",
                        marginTop: "50px",
                      }}
                    />
                  ) : (
                    <Image></Image>
                  )}
                </div>
                <div className="w-full h-full p-2  "></div>
                <div className="w-full h-full p-2  "></div>
                <div className="w-full h-full p-2 mt-20 mb-5">
                  <Tooltip
                    placement="top"
                    label={`Health: ${player_2?.life || "Loading..."}`}
                  >
                    <Image src="/images/player2.png" alt="player-2" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 "></div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2"></div>
                <div className="w-full h-full p-2">
                  {player_2 && player_2.deck && player_2.deck.length > 0 ? (
                    <Image
                      src="/images/cards/back.jpeg"
                      alt="card"
                      style={{
                        width: "100px",
                        height: "auto",
                        marginTop: "50px",
                      }}
                    />
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
