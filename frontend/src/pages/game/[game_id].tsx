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
  Card,
} from "../../../constants/index";
import {
  draw,
  discard,
  play,
  attack,
  generate_discard_proof_with_rust,
  Proof,
  surrender,
  end_turn,
} from "../../../calls/move_calls";
import { get_object_ids } from "../../../calls/api_calls";
import State from "../../../components/State";
import { useLocalStorage } from "usehooks-ts";

export default function GamePage() {
  const { wallet } = ethos.useWallet();

  const [isDisabled, setIsDisabled] = useState(true);
  const [isAttacking, setisAttacking] = useState(false);
  const [isWaitingForDiscard, setIsWaitingForDiscard] =
    useState<boolean>(false);
  const [isWaitingForPlay, setIsWaitingForPlay] = useState(false);
  const [isWaitingForAttack, setIsWaitingForAttack] = useState(false);

  const [is_player_1, setIs_player_1] = useState(false);
  const [is_player_1_turn, setIs_player_1_turn] = useState(false);

  const [player_1, setPlayer_1] = useLocalStorage("player_1", "");
  const [player_2, setPlayer_2] = useLocalStorage("player_2", "");

  const [player_1_hand, setPlayer_1_hand] = useState<Card[]>([]);
  const [player_2_hand, setPlayer_2_hand] = useState<Card[]>([]);

  const [player_1_deck, setPlayer_1_deck] = useState<Card[]>([]);
  const [player_2_deck, setPlayer_2_deck] = useState<Card[]>([]);

  const [player_1_board, setPlayer_1_board] = useState<Card[]>([]);
  const [player_2_board, setPlayer_2_board] = useState<Card[]>([]);

  const [player_1_health, setPlayer_1_health] = useState(0);
  const [player_2_health, setPlayer_2_health] = useState(0);

  const [directPlayerAttacks, setDirectPlayerAttacks] = useState<number>(0);

  const [selected_cards_to_attack, setSelected_cards_to_attack] = useState<
    Card[] | null
  >(null);
  const [selected_cards_to_defend, setSelected_cards_to_defend] = useState<
    Card[] | null
  >(null);

  const router = useRouter();

  function update_state_from_local_storage() {
    setPlayer_1_hand(JSON.parse(localStorage.getItem("player1_hand") || "[]"));
    setPlayer_2_hand(JSON.parse(localStorage.getItem("player2_hand") || "[]"));

    setPlayer_1_deck(JSON.parse(localStorage.getItem("player1_deck") || "[]"));
    setPlayer_2_deck(JSON.parse(localStorage.getItem("player2_deck") || "[]"));
  }

  async function update_board_state() {
    // check if you own the game, else its not turn
    let x = await get_object_ids(wallet, "Game");
    console.log(x);

    // fetch board states from game struct
    setPlayer_1_board(); // player1.board
    setPlayer_2_board(); // player2.board
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
    await discard(wallet, router.query.game_id as string, card.id || "1");
    update_state_from_local_storage();
    await update_board_state();
    setIsWaitingForDiscard(false);
  }

  async function play_card(card: Card) {
    await play(wallet, router.query.game_id as string, card.id || "1");
    update_state_from_local_storage();
    await update_board_state();
    setIsWaitingForPlay(false);
  }

  async function attack_opponent() {
    setIsWaitingForAttack(true);
    if (is_player_1) {
      if (selected_cards_to_attack && selected_cards_to_defend) {
        let game_over = await attack(
          wallet,
          router.query.game_id as string,
          selected_cards_to_attack.map((character: Card) => character.id), // attacking character ids
          selected_cards_to_defend.map((character: Card) => character.id),
          directPlayerAttacks
        );
        await update_board_state();
        if (game_over) {
          window.alert("You won!");
          router.push("/");
        }
      }
    } else {
      if (selected_cards_to_attack && selected_cards_to_defend) {
        setDirectPlayerAttacks(
          selected_cards_to_attack.length - selected_cards_to_defend.length
        );
        let game_over = await attack(
          wallet,
          router.query.game_id as string,
          selected_cards_to_attack.map((character: Card) => character.id), // attacking character ids
          selected_cards_to_defend.map((character: Card) => character.id),
          directPlayerAttacks
        );
        await update_board_state();
        if (game_over) {
          window.alert("You won!");
          router.push("/");
        }
      }
    }
    setIsWaitingForAttack(false);
  }

  async function turn_logic() {
    setisAttacking(true);
    update_state_from_local_storage();
    await update_board_state();

    if (is_player_1_turn) {
      if (is_player_1) {
        setIsDisabled(false);
        await draw(wallet, router.query.game_id as string);
        update_state_from_local_storage();
        if (player_1_hand.length > MAX_HAND_SIZE) {
          setIsWaitingForDiscard(true);
        }
        if (!isWaitingForDiscard) {
          setIsWaitingForPlay(true);
        }
        if (!isWaitingForPlay) {
          setIsWaitingForAttack(true);
        }
        if (!isWaitingForAttack) {
          setisAttacking(false);
        }
      } else {
        setIsDisabled(true);
        if (!isAttacking) {
          await update_board_state();
          setIs_player_1_turn(false);
        }
      }
    }
    // player 2's turn
    else {
      if (!is_player_1) {
        setIsDisabled(false);
        await draw(wallet, router.query.game_id as string);
        update_state_from_local_storage();
        if (player_2_hand.length > MAX_HAND_SIZE) {
          setIsWaitingForDiscard(true);
        }
        if (!isWaitingForDiscard) {
          setIsWaitingForPlay(true);
        }
        if (!isWaitingForPlay) {
          setIsWaitingForAttack(true);
        }
        if (!isWaitingForAttack) {
          setisAttacking(false);
        }
      } else {
        setIsDisabled(true);
        if (!isAttacking) {
          await update_board_state();
          setIs_player_1_turn(true);
        }
      }
    }
  }

  useEffect(() => {
    // const player1FromLocalStorage = localStorage.getItem("player_1");
    // // setIs_player_1(
    // //   wallet?.address !== null &&
    // //     player1FromLocalStorage !== null &&
    // //     wallet?.address === JSON.parse(player1FromLocalStorage)
    // // );
    // if (player1FromLocalStorage !== null) {
    //   console.log("player1: " + JSON.parse(player1FromLocalStorage));
    // } else {
    //   console.log("player1FromLocalStorage is null");
    // }
    // console.log("isplayer1: " + is_player_1);
    // console.log("turn " + is_player_1_turn);
    // turn_logic();
    console.log("player_1: " + player_1);
    console.log("player_2: " + player_2);
    console.log("isplayer1: " + is_player_1);
  }, [is_player_1_turn]);

  return (
    <>
      {is_player_1 ? (
        <>
          <div
            className={
              "min-h-screen flex flex-col items-center bg-[url('/images/map.png')]"
            }
          >
            {/* Main Div */}
            <div className="grid grid-rows-7 min-h-screen w-4/5 gap-2">
              {/* FIRST DIV */}
              {/* Second Div */}
              <div className="grid grid-cols-8 w-full min-h-full bg-green-500 row-span-2 p-2 gap-2 ">
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 ">CARD 2</div>
                <div className="w-full h-full p-2 bg-green-800 ">CARD 3</div>
                <div className="w-full h-full p-2 bg-green-800 ">CARD 4</div>
                <div className="w-full h-full p-2 bg-green-800 ">CARD 5</div>
                <div className="w-full h-full p-2 bg-green-800 ">CARD 6</div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div></div>
              </div>
            </div>
            {/* Third Div */}
            <div className="grid grid-cols-8 w-full min-h-full bg-green-500 p-2 gap-2 ">
              <div className="w-full h-full p-2 bg-green-800 ">
                <Image src="/images/cards/back.jpeg" alt="your-deck" />
              </div>
              <div className="w-full h-full p-2 bg-green-800 ">CARD 2</div>
              <div className="w-full h-full p-2 bg-green-800 ">CARD 3</div>
              <div className="w-full h-full p-2 bg-green-800 ">CARD 4</div>
              <div className="w-full h-full p-2 bg-green-800 ">CARD 5</div>
              <div className="w-full h-full p-2 bg-green-800 ">CARD 6</div>
              <div className="w-full h-full p-2 bg-green-800 ">CARD 7</div>
              <div></div>
            </div>
          </div>
          <div className="grid grid-cols-3 min-h-full bg-orange-400 w-full items-center">
            <div className="flex justify-center ">
              <Button
                colorScheme="red"
                isLoading={isAttacking}
                onClick={() => {
                  surrender(wallet, router.query.game_id as string);
                  router.push("/");
                }}
              >
                Surrender
              </Button>
            </div>
            <div className="flex justify-center"></div>
            <div className="flex justify-center ">
              <Button
                colorScheme="yellow"
                isLoading={isAttacking}
                onClick={() => end_turn(wallet, router.query.game_id as string)}
                disabled={isDisabled}
              >
                End Turn
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2 ">
            <div></div>
            <div className="w-full h-full p-2 bg-blue-800 ">CARD 1</div>
            <div className="w-full h-full p-2 bg-blue-800 ">CARD 2</div>
            <div className="w-full h-full p-2 bg-blue-800 ">CARD 3</div>
            <div className="w-full h-full p-2 bg-blue-800 ">CARD 4</div>
            <div className="w-full h-full p-2 bg-blue-800 ">CARD 5</div>
            <div className="w-full h-full p-2 bg-blue-800 ">CARD 6</div>
            <div className="w-full h-full p-2 bg-blue-800 ">
              {player_1_hand.length > 0 ? (
                <Image src="/images/cards/back.jpeg" alt="enemy-deck" />
              ) : (
                <Image></Image>
              )}
            </div>
          </div>
          <div className="h-full  grid grid-rows-5 items-center row-span-3 gap-2 ">
            <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2">
              <div></div>
              <div className="w-full h-full p-2 bg-blue-800 ">CARD 1</div>
              <div className="w-full h-full p-2 bg-blue-800 ">CARD 2</div>
              <div className="w-full h-full p-2 bg-blue-800 ">CARD 3</div>
              <div className="w-full h-full p-2 bg-blue-800 ">CARD 4</div>
              <div className="w-full h-full p-2 bg-blue-800 ">CARD 5</div>
              <div className="w-full h-full p-2 bg-blue-800 ">CARD 6</div>
              <div className="w-full h-full p-2 bg-blue-800 "></div>
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
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 "></div>
                <div className="w-full h-full p-2 bg-blue-800 ">
                  <Tooltip
                    placement="bottom"
                    label={`Health: ${player_1_health}`}
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
                <div></div>
                <div className="w-full h-full p-2 bg-blue-800 ">CARD 1</div>
                <div className="w-full h-full p-2 bg-blue-800 ">CARD 2</div>
                <div className="w-full h-full p-2 bg-blue-800 ">CARD 3</div>
                <div className="w-full h-full p-2 bg-blue-800 ">CARD 4</div>
                <div className="w-full h-full p-2 bg-blue-800 ">CARD 5</div>
                <div className="w-full h-full p-2 bg-blue-800 ">CARD 6</div>
                <div className="w-full h-full p-2 bg-blue-800 ">
                  {player_1_hand.length > 0 ? (
                    <Image src="/images/cards/back.jpeg" alt="enemy-deck" />
                  ) : (
                    <Image></Image>
                  )}
                </div>
              </div>
              {/* Second Div */}
              <div className="h-full  grid grid-rows-7 items-center row-span-3 gap-2 ">
                <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2">
                  <div></div>
                  <div className="w-full h-full p-2 bg-blue-800 ">CARD 1</div>
                  <div className="w-full h-full p-2 bg-blue-800 ">CARD 2</div>
                  <div className="w-full h-full p-2 bg-blue-800 ">CARD 3</div>
                  <div className="w-full h-full p-2 bg-blue-800 ">CARD 4</div>
                  <div className="w-full h-full p-2 bg-blue-800 ">CARD 5</div>
                  <div className="w-full h-full p-2 bg-blue-800 ">CARD 6</div>
                  <div className="w-full h-full p-2 bg-blue-800 "></div>
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
                  <div className="w-full h-full p-2 bg-green-800 "></div>
                  <div className="w-full h-full p-2 bg-green-800 ">CARD 2</div>
                  <div className="w-full h-full p-2 bg-green-800 ">CARD 3</div>
                  <div className="w-full h-full p-2 bg-green-800 ">CARD 4</div>
                  <div className="w-full h-full p-2 bg-green-800 ">CARD 5</div>
                  <div className="w-full h-full p-2 bg-green-800 ">CARD 6</div>
                  <div className="w-full h-full p-2 bg-green-800 "></div>
                  <div></div>
                </div>
              </div>
              <div className="grid grid-cols-8 w-full min-h-full bg-green-500 p-2 gap-2 ">
                <div className="w-full h-full p-2 bg-green-800 ">
                  <Image src="/images/cards/back.jpeg" alt="your-deck" />
                </div>
                {player_2_hand.map((card: Card, index: number) => (
                  <div key={index} className="w-full h-full p-2 bg-green-800">
                    <Tooltip
                      placement="bottom"
                      label={`Card Name: ${card.name}\nCard Description: ${card.description}\nAttack: ${card.attack}\nDefense: ${card.defense}`}
                    >
                      <Button
                        onClick={() => handleCardClick(card)} // Replace with your onClick handler function
                        className="w-full h-full p-0 hover:border-red-500"
                        style={{
                          border: isWaitingForAttack ? "2px solid red" : "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      ></Button>
                    </Tooltip>
                  </div>
                ))}
              </div>
              <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2">
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 ">
                  <Tooltip placement="top" label={`Health: ${player_2_health}`}>
                    <Image src="/images/player2.png" alt="player-2" />
                  </Tooltip>
                </div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
                <div className="w-full h-full p-2 bg-green-800 "></div>
              </div>
            </div>
          </div>
        </>
      )}
      ;
    </>
  );
}
