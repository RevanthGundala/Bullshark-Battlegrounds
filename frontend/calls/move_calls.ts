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
    const tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::challenge_person`,
      arguments: [transactionBlock.pure(opponent, "address")],
    });
    const response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock,
      chain: Chain.SUI_DEVNET,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });
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
    const tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::accept_challenge`,
      arguments: [transactionBlock.object(challenge_id)],
    });
    const response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock,
      chain: Chain.SUI_DEVNET,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });
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
  player_1: PlayerBackend,
  player_2: PlayerBackend
) => {
  if (!wallet) return;
  try {
    let vk: string = "";
    let public_inputs_bytes: string = "";
    let proof_points_bytes: string = "";
    let new_hand_commitment: string = "";
    let transactionBlock = new TransactionBlock();

    let index;
    let deck;
    let hand;

    // todo: fix if statement -> use dRand
    if (is_player_1) {
      index = Math.floor(Math.random() * player_1.deck.length);
    } else {
      index = Math.floor(Math.random() * player_2.deck.length);
    }

    // todo: generate random index, put put draw logic after move call

    const tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::draw`,
      arguments: [
        transactionBlock.object(game_id),
        transactionBlock.pure(vk, "vector<u8>"),
        transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
        transactionBlock.pure(proof_points_bytes, "vector<u8>"),
        transactionBlock.pure(new_hand_commitment, "vector<u8>"),
      ],
    });
    let response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      },
    });
    console.log("Draw Response: Success\n", response);

    // Perform on-chain logic then update hand + deck in server

    if (is_player_1) {
      player_1.hand?.push(player_1.deck?.[index]);
      player_1.deck?.splice(index, 1);
    } else {
      player_2.hand?.push(player_2.deck?.[index] || "");
      player_2.deck?.splice(index, 1);
    }

    let post_response = await fetch("http://localhost:5002/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player_1: {
          address: player_1.address,
          hand: player_1.hand,
          deck: player_1.deck,
        },
        player_2: {
          address: player_2.address,
          hand: player_2.hand,
          deck: player_2.deck,
        },
      }),
    });
    if (!post_response.ok) {
      throw new Error(post_response.status.toString());
    }
    const result = await post_response.text();
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};

export const discard = async (
  wallet: Wallet | undefined,
  game_id: string,
  id_card_to_discard: string,
  is_player_1: boolean,
  player_1: PlayerBackend,
  player_2: PlayerBackend
) => {
  try {
    let output: string = "";
    let alpha_string: string = "";
    let public_key: string = "";
    let proof: string = "";
    let vk: string = "";
    let public_inputs_bytes: string = "";
    let proof_points_bytes: string = "";
    let new_hand_commitment: string = "";
    let transactionBlock = new TransactionBlock();

    let hand;
    let index;

    if (is_player_1) {
      hand = player_1.hand;
    } else {
      hand = player_2.hand;
    }
    transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::discard`,
      arguments: [
        transactionBlock.object(game_id),
        transactionBlock.pure(output, "vector<u8>"),
        transactionBlock.pure(alpha_string, "vector<u8>"),
        transactionBlock.pure(public_key, "vector<u8>"),
        transactionBlock.pure(proof, "vector<u8>"),
        transactionBlock.pure(vk, "vector<u8>"),
        transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
        transactionBlock.pure(proof_points_bytes, "vector<u8>"),
        transactionBlock.object(id_card_to_discard),
        transactionBlock.pure(new_hand_commitment, "vector<u8>"),
      ],
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
    console.log("Discard: Success", response);

    // add card to graveyard
    if (is_player_1) {
      player_1.hand?.push(id_card_to_discard);
      index =
        player_1.hand?.findIndex(
          (card: string) => card === id_card_to_discard
        ) || 0;
      player_1.hand?.splice(index, 1);
    } else {
      player_2.hand?.push(id_card_to_discard);
      index =
        player_2.hand?.findIndex(
          (card: string) => card === id_card_to_discard
        ) || 0;
      player_2.hand?.splice(index, 1);
    }

    // update deck and hand in server
    let post_response = await fetch("http://localhost:5002/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player_1: {
          address: player_1.address,
          hand: player_1.hand,
          deck: player_1.deck,
        },
        player_2: {
          address: player_2.address,
          hand: player_2.hand,
          deck: player_2.deck,
        },
      }),
    });
    if (!post_response.ok) {
      throw new Error(post_response.status.toString());
    }
    const result = await post_response.text();
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};
export const play = async (
  wallet: Wallet | undefined,
  game_id: string,
  id_card_to_play: string,
  is_player_1: boolean,
  player_1: PlayerBackend,
  player_2: PlayerBackend
) => {
  if (!wallet) return;
  try {
    let output: string = "";
    let alpha_string: string = "";
    let public_key: string = "";
    let proof: string = "";
    let vk: string = "";
    let public_inputs_bytes: string = "";
    let proof_points_bytes: string = "";
    let new_hand_commitment: string = "";

    let index;
    let hand;

    // find id of card to play in localStorage
    if (is_player_1) {
      hand = player_1.hand;
    } else {
      hand = player_2.hand;
    }
    // generate comittment from hand

    let transactionBlock = new TransactionBlock();
    let tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::play`,
      arguments: [
        transactionBlock.object(game_id),
        transactionBlock.pure(output, "vector<u8>"),
        transactionBlock.pure(alpha_string, "vector<u8>"),
        transactionBlock.pure(public_key, "vector<u8>"),
        transactionBlock.pure(proof, "vector<u8>"),
        transactionBlock.pure(vk, "vector<u8>"),
        transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
        transactionBlock.pure(proof_points_bytes, "vector<u8>"),
        transactionBlock.object(id_card_to_play),
        transactionBlock.pure(new_hand_commitment, "vector<u8>"),
      ],
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
    console.log("Play Response: Success\n", response);
    // remove card from hand
    if (is_player_1) {
      index =
        player_1.hand?.findIndex((card: string) => card === id_card_to_play) ||
        0;
      player_1.hand?.splice(index, 1);
    } else {
      index =
        player_2.hand?.findIndex((card: string) => card === id_card_to_play) ||
        0;
      player_2.hand?.splice(index, 1);
    }

    // update deck and hand in server
    let post_response = await fetch("http://localhost:5002/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player_1: {
          address: player_1.address,
          hand: player_1.hand,
          deck: player_1.deck,
        },
        player_2: {
          address: player_2.address,
          hand: player_2.hand,
          deck: player_2.deck,
        },
      }),
    });
    if (!post_response.ok) {
      throw new Error(post_response.status.toString());
    }
    const result = await post_response.text();
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};

export const attack = async (
  wallet: Wallet | undefined,
  game_id: string,
  attacking_characters: string[], // card id
  defending_characters: string[],
  direct_player_attacks: number
) => {
  if (!wallet) return;
  try {
    let transactionBlock = new TransactionBlock();
    let tx = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::attack`,
      arguments: [
        transactionBlock.object(game_id),
        transactionBlock.makeMoveVec({
          objects: attacking_characters.map((character: string) =>
            transactionBlock.object(character)
          ),
        }),
        transactionBlock.makeMoveVec({
          objects: defending_characters.map((character: string) =>
            transactionBlock.object(character)
          ),
        }),
        transactionBlock.pure(direct_player_attacks),
      ],
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
    console.log("Attack Response: Success\n", response);

    let game_over = false;
    await listen_for_events();
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

// export const generate_draw_proof_with_rust = async () => {
//   try {
//     let draw_proof: Proof = await generate_draw_proof();
//     return draw_proof;
//   } catch (error) {
//     console.log(error);
//   }
// };

// export const generate_discard_proof_with_rust = async () => {
//   try {
//     let discard_proof: Proof = await generate_discard_proof();
//     return discard_proof;
//   } catch (error) {
//     console.log(error);
//   }
// };
