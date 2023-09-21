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
import Player from "../../../components/Display/Player";
import Deck from "../../../components/Display/Hand";
import Board from "../../../components/Display/Board";
import Divider from "../../../components/Display/Divider";
import Hand from "../../../components/Display/Hand";
import Area from "../../../components/Display/Area";
import Half from "../../../components/Display/Half";

//TODO: Add logic for when a player wins
//TODO: Fix Attack logic

export default function GamePage() {
  const { wallet, provider } = ethos.useWallet();

  const [has_drawn, setHas_drawn] = useState(false);
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
    played_card_this_turn: boolean;
  }

  interface PlayerBackend {
    address: string;
    hand: string[];
    deck: string[];
  }

  let id: any;

  async function match_game_state() {
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
      setSelected_cards_to_attack([]);
      setSelected_cards_to_defend([]);
      setHas_drawn(false);
    } else {
      console.log("match_game_state: game state is invalid");
    }
  }

  function new_player_object(
    address: string,
    board: Card[] | undefined,
    deck_commitment: string,
    deck_size: number,
    graveyard: Card[] | undefined,
    hand_commitment: string,
    hand_size: number,
    id: string,
    life: number,
    deck: Card[] | undefined,
    hand: Card[] | undefined,
    played_card_this_turn: boolean
  ): PlayerObject {
    return {
      address: address,
      board: board,
      deck_commitment: deck_commitment,
      deck_size: deck_size,
      graveyard: graveyard,
      hand_commitment: hand_commitment,
      hand_size: hand_size,
      id: id,
      life: life,
      deck: deck,
      hand: hand,
      played_card_this_turn: played_card_this_turn,
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
      [],
      false
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
      [],
      false
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
      if (
        (player_1?.board?.includes(card) && is_player_1) ||
        (player_2?.board?.includes(card) && !is_player_1)
      ) {
        if (
          !selected_cards_to_attack?.includes(index) &&
          !player_1.played_card_this_turn &&
          !player_2.played_card_this_turn
        ) {
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
  async function set_game_object() {
    try {
      let game_obj = await provider?.getObject({
        id: router.query.game_id as string,
        options: { showContent: true, showOwner: true },
      });
      if (JSON.stringify(game_obj) !== JSON.stringify(game_object)) {
        setGame_object(game_obj);
        setGame(game_obj?.data?.content);
      }
    } catch (err) {
      console.log(err);
    }
  }
  useEffect(() => {
    let updating = true;
    update_board_state();

    id = setInterval(() => {
      if (
        (is_player_1 && !is_player_1_turn) ||
        (!is_player_1 && is_player_1_turn)
      ) {
        set_game_object();
      }
    }, 5000);
    return () => {
      clearInterval(id);
      updating = false;
    };

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
        players.player_1.address !== p1_addr
          ? setP1_addr(players.player_1.address)
          : undefined;
        players.player_2.address !== p2_addr
          ? setP2_addr(players.player_2.address)
          : undefined;
        setIs_player_1(p1_addr === wallet?.address);
        await set_game_object();
        if (!game_object) {
          console.log("game is undefined, cant update state");
          return;
        }
        p1_addr === game_object?.data?.owner.AddressOwner
          ? setIs_player_1_turn(true)
          : setIs_player_1_turn(false);
        await match_game_state();
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
          p1_hand,
          p1_contract?.played_card_this_turn
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
          p2_hand,
          p2_contract?.played_card_this_turn
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
        if (player_1 && player_2 && isWaitingForDraw) {
          await draw_logic();
        }
        console.log("Finished updating board state...");
      } catch (err) {
        console.log(err);
      }
    }

    async function draw_logic() {
      try {
        if (!updating) {
          console.log("Not updating draw logic");
          return;
        }
        console.log("Updating draw logic...");
        let player =
          is_player_1_turn && is_player_1 && player_1
            ? get_player_backend(player_1)
            : !is_player_1_turn && !is_player_1 && player_2
            ? get_player_backend(player_2)
            : undefined;
        if (player && !has_drawn) {
          setHas_drawn(true);
          let success = await draw(
            wallet,
            router.query.game_id as string,
            is_player_1,
            player
          );
          success ? console.log("Draw successful") : console.log("Draw failed");
        }
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
    wallet?.contents?.nfts,
    provider,
  ]);

  return (
    <>
      {is_player_1 ? (
        <>
          <main className="min-h-screen bg-red-200">
            <Half
              player_num={2}
              player_obj={player_2}
              show_cards={false}
              isWaitingForAttack={isWaitingForAttack}
              opponent_perspective={true}
              handleCardClick={handleCardClick}
            />
            <section className=" bg-orange-400 w-full p-8">
              <Divider
                isWaitingForAttack={isWaitingForAttack}
                isWaitingForDraw={isWaitingForDraw}
                isWaitingForPlay={isWaitingForPlay}
                isWaitingForDiscard={isWaitingForDiscard}
                wallet={wallet}
                router={router}
                selected_cards_to_attack={selected_cards_to_attack}
                selected_cards_to_defend={selected_cards_to_defend}
                is_player_1={is_player_1}
                is_player_1_turn={is_player_1_turn}
              />
            </section>
            <Half
              player_num={1}
              player_obj={player_1}
              show_cards={true}
              isWaitingForAttack={isWaitingForAttack}
              opponent_perspective={false}
              handleCardClick={handleCardClick}
            />
          </main>
        </>
      ) : (
        <>
          <main className="min-h-screen bg-red-200">
            <Half
              player_num={1}
              player_obj={player_1}
              show_cards={false}
              isWaitingForAttack={isWaitingForAttack}
              opponent_perspective={true}
              handleCardClick={handleCardClick}
            />
            <section className=" bg-orange-400 w-full p-8">
              <Divider
                isWaitingForAttack={isWaitingForAttack}
                isWaitingForDraw={isWaitingForDraw}
                isWaitingForPlay={isWaitingForPlay}
                isWaitingForDiscard={isWaitingForDiscard}
                wallet={wallet}
                router={router}
                selected_cards_to_attack={selected_cards_to_attack}
                selected_cards_to_defend={selected_cards_to_defend}
                is_player_1={is_player_1}
                is_player_1_turn={is_player_1_turn}
              />
            </section>
            <Half
              player_num={2}
              player_obj={player_2}
              show_cards={true}
              isWaitingForAttack={isWaitingForAttack}
              opponent_perspective={false}
              handleCardClick={handleCardClick}
            />
          </main>
        </>
      )}
    </>
  );
}
