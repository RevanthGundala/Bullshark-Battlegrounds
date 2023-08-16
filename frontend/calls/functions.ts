import { Wallet } from "ethos-connect";
import { MAX_HAND_SIZE, TOTAL_DECK_SIZE } from "../constants";
import { get_object_from_id } from "./api_calls";

export const create_game = async (accepter: string, opponent: string) => {
  // when someone calls create_game, I know that p2 is the accepter, and p1 owns the object
  localStorage.setItem("player_1", opponent);
  localStorage.setItem("player_2", accepter);

  console.log("player1 in create: " + opponent);
  console.log("player2 in create: " + accepter);
  // let nfts = accepter.contents
  // let enemy_nfts = opponent.contents

  // let player_1_deck: any[] = []; // nfts.slice(0, STARTING_DECK_SIZE)
  // let player_1_hand = [];
  // let player_2_deck: any[] = [];
  // let player_2_hand = [];

  // // move cards from deck to hand in random way
  // for (let i = 0; i < MAX_HAND_SIZE; i++) {
  //   let index: number = Math.floor(Math.random() * TOTAL_DECK_SIZE);
  //   player_1_hand.push(player_1_deck[index]);
  //   player_1_deck.splice(index, 1);
  // }
  // for (let i = 0; i < MAX_HAND_SIZE; i++) {
  //   let index: number = Math.floor(Math.random() * TOTAL_DECK_SIZE);
  //   player_2_hand.push(player_2_deck[index]);
  //   player_2_deck.splice(index, 1);
  // }

  // player_1_deck.map(async (id: string) => {
  //   await get_object_from_id(id, "Card");
  // });

  // player_2_deck.map(async (id: string) => {
  //   await get_object_from_id(id, "Card");
  // });

  // localStorage.setItem("player_1_hand", JSON.stringify(player_1_hand));
  // localStorage.setItem("player_1_deck", JSON.stringify(player_1_deck));
  // localStorage.setItem("player_2_hand", JSON.stringify(player_2_hand));
  // localStorage.setItem("player_2_deck", JSON.stringify(player_2_deck));
};
