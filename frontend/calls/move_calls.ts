import { Chain, TransactionBlock, Wallet } from "ethos-connect";
import { MODULE_ADDRESS, MAX_HAND_SIZE, TOTAL_DECK_SIZE } from "../constants";
import { get_object_ids, listen_for_events } from "./api_calls";
import { NextRouter } from "next/router";
import { NFTS } from "../constants";
import { poseidonHash, prove } from "./prove";
// @ts-ignore
import { buildPoseidon } from "circomlibjs";

export type Proof = {
  public_inputs_bytes: string | undefined;
  proof_points_bytes: string | undefined;
};

interface PlayerBackend {
  address: string;
  hand: string[];
  deck: string[];
}

export const get_new_character = async (wallet: Wallet | undefined) => {
  if (!wallet) return;
  try {
    const transactionBlock = new TransactionBlock();
    NFTS.forEach((nft) => {
      transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::get_new_character`,
        arguments: [
          transactionBlock.pure(nft.name),
          transactionBlock.pure(nft.description),
          transactionBlock.pure(nft.url),
          transactionBlock.pure(Math.floor(Math.random() * 5)),
          transactionBlock.pure(Math.floor(Math.random() * 5)),
        ],
      });
    });
    const response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });
    // const poseidon = await buildPoseidon();
    // const input = poseidonHash(poseidon, [7]);
    // const witness = {
    //   in: input,
    // };
    // const solProof = await prove(witness, "draw");
    // console.log(solProof);
    console.log("Get New Character Response", response);
  } catch (error) {
    console.log(error);
  }
};

export const challenge_person = async (
  wallet: Wallet | undefined,
  opponent: string
) => {
  if (!wallet) return;
  try {
    const transactionBlock = new TransactionBlock();
    let args = [transactionBlock.pure(opponent, "address")];
    let response = await move_call(
      wallet,
      transactionBlock,
      `${MODULE_ADDRESS}::card_game::challenge_person`,
      args
    );
    console.log("Challenge Person: Success\n", response);
  } catch (error) {
    console.log(error);
  }
};
export const accept_challenge = async (
  wallet: Wallet | undefined,
  challenge_id: string
) => {
  if (!wallet) return;
  try {
    const transactionBlock = new TransactionBlock();
    let args = [transactionBlock.object(challenge_id)];
    let response = await move_call(
      wallet,
      transactionBlock,
      `${MODULE_ADDRESS}::card_game::accept_challenge`,
      args
    );
    console.log("Accept Challenge: Success\n", response);
    let objectId = "";
    response?.objectChanges?.forEach((change) => {
      // Check if the object has the 'objectId' property
      if ("objectId" in change) {
        objectId = change.objectId; // will grab the second objectId
      }
    });
    console.log(objectId);
    return objectId;
  } catch (error) {
    console.log(error);
  }
};

export const draw = async (
  wallet: Wallet | undefined,
  game_id: string,
  is_player_1: boolean,
  player: PlayerBackend
) => {
  if (!wallet) return;
  try {
    let vk: string = "";
    let public_inputs_bytes: string = "";
    let proof_points_bytes: string = "";
    let new_hand_commitment: string = "";
    let new_deck_commitment: string = "";
    let discard = false;
    let index;

    // todo: fix if statement -> use dRand
    // todo: generate random index, put put draw logic after move call
    index = Math.floor(Math.random() * player.deck.length);
    let transactionBlock = new TransactionBlock();
    let args = [
      transactionBlock.object(game_id),
      transactionBlock.pure(vk, "vector<u8>"),
      transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
      transactionBlock.pure(proof_points_bytes, "vector<u8>"),
      transactionBlock.pure(new_hand_commitment, "vector<u8>"),
      transactionBlock.pure(new_deck_commitment, "vector<u8>"),
    ];
    let response = await move_call(
      wallet,
      transactionBlock,
      `${MODULE_ADDRESS}::card_game::draw`,
      args
    );
    console.log("Draw Response: Success\n", response);

    // Perform on-chain logic then update hand + deck in server
    player.hand?.push(player.deck?.[index]);
    player.deck?.splice(index, 1);

    if (player.hand?.length > MAX_HAND_SIZE) {
      discard = true;
    }
    await insert_updated_players(is_player_1, player);
    return discard;
  } catch (error) {
    console.log(error);
  }
};

export const discard = async (
  wallet: Wallet | undefined,
  game_id: string,
  id_card_to_discard: string,
  is_player_1: boolean,
  player: PlayerBackend
) => {
  try {
    let vk: string = "";
    let public_inputs_bytes: string = "";
    let proof_points_bytes: string = "";
    let new_hand_commitment: string = "";

    let index;
    let transactionBlock = new TransactionBlock();
    let args = [
      transactionBlock.object(game_id),
      transactionBlock.pure(vk, "vector<u8>"),
      transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
      transactionBlock.pure(proof_points_bytes, "vector<u8>"),
      transactionBlock.object(id_card_to_discard),
      transactionBlock.pure(new_hand_commitment, "vector<u8>"),
    ];
    let response = await move_call(
      wallet,
      transactionBlock,
      `${MODULE_ADDRESS}::card_game::discard`,
      args
    );
    console.log("Discard: Success", response);

    // add card to graveyard
    index = player.hand?.findIndex(
      (card: string) => card === id_card_to_discard
    );
    player.hand?.splice(index, 1);
    await insert_updated_players(is_player_1, player);
  } catch (error) {
    console.log(error);
  }
};
export const play = async (
  wallet: Wallet | undefined,
  game_id: string,
  id_card_to_play: string,
  is_player_1: boolean,
  player: PlayerBackend
) => {
  if (!wallet) return;
  try {
    let vk: string = "";
    let public_inputs_bytes: string = "";
    let proof_points_bytes: string = "";
    let new_hand_commitment: string = "";

    let index;

    // find id of card to play in localStorage

    let transactionBlock = new TransactionBlock();
    let args = [
      transactionBlock.object(game_id),
      transactionBlock.pure(vk, "vector<u8>"),
      transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
      transactionBlock.pure(proof_points_bytes, "vector<u8>"),
      transactionBlock.object(id_card_to_play),
      transactionBlock.pure(new_hand_commitment, "vector<u8>"),
    ];

    let response = await move_call(
      wallet,
      transactionBlock,
      `${MODULE_ADDRESS}::card_game::play`,
      args
    );
    console.log("Play Response: Success\n", response);
    // remove card from hand
    index = player.hand?.findIndex((card: string) => card === id_card_to_play);
    player.hand?.splice(index, 1);

    // check if its p1 or p2

    await insert_updated_players(is_player_1, player);
  } catch (error) {
    console.log(error);
  }
};

export const attack = async (
  wallet: Wallet | undefined,
  game_id: string,
  attacking_characters: number[], // card index
  defending_characters: number[],
  direct_player_attacks: number
) => {
  if (!wallet) return;
  try {
    let transactionBlock = new TransactionBlock();
    console.log("attacking characters in move call ; ", attacking_characters);
    let args = [
      transactionBlock.object(game_id),
      transactionBlock.makeMoveVec({
        objects:
          attacking_characters.map((index: number) =>
            transactionBlock.pure(index)
          ) || [],
      }),
      transactionBlock.makeMoveVec({
        objects:
          defending_characters.map((index: number) =>
            transactionBlock.pure(index)
          ) || [],
      }),
      transactionBlock.pure(direct_player_attacks),
    ];
    let response = await move_call(
      wallet,
      transactionBlock,
      `${MODULE_ADDRESS}::card_game::attack`,
      args
    );
    console.log("Attack Response: Success\n", response);

    let game_over = false;
    // await listen_for_events();
    /*
      if(event.winner == wallet.address){
        game_over = true;
      }
      */
    return game_over;
  } catch (error) {
    console.log(error);
  }
};

export const end_turn = async (wallet: Wallet | undefined, game_id: string) => {
  if (!wallet) return;
  try {
    let transactionBlock = new TransactionBlock();
    let tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::end_turn`,
      arguments: [transactionBlock.object(game_id)],
    });
    let response = await wallet?.signAndExecuteTransactionBlock({
      transactionBlock,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });

    console.log("Transaction Response", response);
  } catch (error) {
    console.log(error);
  }
};

export const surrender = async (
  wallet: Wallet | undefined,
  game_id: string
) => {
  if (!wallet) return;
  try {
    const transactionBlock = new TransactionBlock();
    const tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::surrender`,
      arguments: [transactionBlock.object(game_id)],
    });
    const response = await wallet?.signAndExecuteTransactionBlock({
      transactionBlock,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });
    console.log("Transaction Response", response);
    /*
      if(event.winner == wallet.address){
        window.alert("You won!");
      }
      */
    //   setIsLoading(false);
    //   router.push("/");
  } catch (error) {
    console.log(error);
  }
};

const move_call = async (
  wallet: Wallet | undefined,
  transactionBlock: TransactionBlock,
  target: any,
  args: any[]
) => {
  try {
    const tx = transactionBlock.moveCall({
      target: target,
      arguments: [...args],
    });
    const response = await wallet?.signAndExecuteTransactionBlock({
      transactionBlock,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

const insert_updated_players = async (
  is_player_1: boolean,
  player: PlayerBackend
) => {
  let get_response = await fetch("http://localhost:5002/api/get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const players = await get_response.json();
  let response_body;
  if (is_player_1) {
    response_body = JSON.stringify({
      player_1: {
        address: player.address,
        hand: player.hand,
        deck: player.deck,
      },
      player_2: players.player_2,
    });
  } else {
    response_body = JSON.stringify({
      player_1: players.player_1,
      player_2: {
        address: player.address,
        hand: player.hand,
        deck: player.deck,
      },
    });
  }

  let post_response = await fetch("http://localhost:5002/api/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: response_body,
  });

  if (!post_response.ok) {
    throw new Error(post_response.status.toString());
  }
  const result = await post_response.text();
  console.log(result);
};

// export const preapprove_draw = async (
//   wallet: Wallet | undefined,
//   game_id: string
// ) => {
//   if (!wallet) return;
//   try {
//     const result = await wallet.requestPreapproval({
//       module: MODULE_ADDRESS,
//       function: "draw",
//       objectId: game_id,
//       description:
//         "Pre-approve moves in the game so you can play without signing every transaction.",
//       totalGasLimit: 500000,
//       maxTransactionCount: 25,
//     });

//     preapproval = result.approved;
//   } catch (e) {
//     console.log("Error requesting preapproval", e);
//     preapproval = false;
//   }
//   return preapproval;
// };
