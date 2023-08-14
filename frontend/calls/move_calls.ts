import { TransactionBlock, Wallet } from "ethos-connect";
import { MODULE_ADDRESS, MAX_HAND_SIZE, TOTAL_DECK_SIZE } from "../constants";
import { get_object_ids, listen_for_events } from "./api_calls";
import { create_game } from "./functions";
import { NextRouter } from "next/router";

export type Proof = {
    public_inputs_bytes: string | undefined,
    proof_points_bytes: string | undefined,
}

export const get_new_character = async (
    wallet: Wallet | undefined,
    name: string,
    description: string,
    image_url: string,
    attack: number,
    defense: number,
    ) => {
    if (!wallet) return
    try {
      const transactionBlock = new TransactionBlock();
      const tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::get_new_character`,
        arguments: [
          transactionBlock.pure(name),
          transactionBlock.pure(description),
          transactionBlock.pure(image_url),
          transactionBlock.pure(attack),
          transactionBlock.pure(defense),
        ]});
        return transactionBlock;
      // const response = await wallet.signAndExecuteTransactionBlock({
      //   transactionBlock,
      //   options: {
      //     showInput: true,
      //     showEffects: true,
      //     showEvents: true,
      //     showBalanceChanges: true,
      //     showObjectChanges: true,
      //   }
      // });
      // console.log("Get New Character Response", response)
    } catch (error) {
      console.log(error)
    }
  }

export const challenge_person = async (wallet: Wallet | undefined, opponent: string) => {
    if (!wallet) return
    try {
      const transactionBlock = new TransactionBlock();
      const tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::challenge_person`,
        arguments: [
          transactionBlock.pure(opponent, "address"),
        ]});
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true,
        }
      });
      console.log("Challenge Person Response", response)
    } catch (error) {
      console.log(error)
    }
  }
export const accept_challenge = async (wallet: Wallet | undefined, challenge_id: string) => {
    if (!wallet) return
    try {
      const transactionBlock = new TransactionBlock();
      const tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::accept_challenge`,
        arguments: [
          transactionBlock.object(challenge_id),
        ]});
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true,
        }
      });
      console.log("Accept Challenge Response: ", response)
      let objectId = "";
      response?.objectChanges?.forEach(change => {
        // Check if the object has the 'objectId' property
        if ("objectId" in change) {
          objectId = change.objectId;
          // Use objectId as needed
          console.log("Object ID ", objectId);
        }
      });
      return objectId;
    } catch (error) {
      console.log(error)
    }
  }

 export const draw = async (
    wallet: Wallet | undefined, 
    game_id: string
    ) => {
    if (!wallet) return
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

        let index;
        let deck_size;
        let deck;
        let hand;
        // update deck and hand after drawnig

        // todo: fix if statement
        if(wallet.address === JSON.parse(localStorage.getItem("player_1") || "[]")){
           // read deck size from game_struct
          deck_size = 0;
          index = Math.floor(Math.random() * deck_size);
          hand = JSON.parse(localStorage.getItem("player_1_hand") || "[]");
          deck = JSON.parse(localStorage.getItem("player_1_deck") || "[]");
          // add card to hand
          hand.push(deck[index]);

          // remove card from deck
          deck.splice(index, 1);
          
          // update deck and hand in local storage
          localStorage.setItem("player_1_hand", JSON.stringify(hand));
          localStorage.setItem("player_1_deck", JSON.stringify(deck));

        }
        else{
          deck_size = 0;
          index = Math.floor(Math.random() * deck_size);
          hand = JSON.parse(localStorage.getItem("player_2_hand") || "[]");
          deck = JSON.parse(localStorage.getItem("player_2_deck") || "[]");
          // add card to hand
          hand.push(deck[index]);

          // remove card from deck
          deck.splice(index, 1);
          
          // update deck and hand in local storage
          localStorage.setItem("player_2_hand", JSON.stringify(hand));
          localStorage.setItem("player_2_deck", JSON.stringify(deck));
        }

        // todo: generate random index, put put draw logic after move call

       const [attacking_player_hand_size, 
        attacking_player_deck_size,
        defending_player_hand_size,
        defending_player_deck_size]
         = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::draw`,
        arguments: [
          transactionBlock.object(game_id),
          transactionBlock.pure(output, "vector<u8>"),
          transactionBlock.pure(alpha_string, "vector<u8>"),
          transactionBlock.pure(public_key, "vector<u8>"),
          transactionBlock.pure(proof, "vector<u8>"),
          transactionBlock.pure(vk, "vector<u8>"),
          transactionBlock.pure(public_inputs_bytes, "vector<u8>"),
          transactionBlock.pure(proof_points_bytes, "vector<u8>"),
          transactionBlock.pure(new_hand_commitment, "vector<u8>"),
        ]});
        let response = await wallet.signAndExecuteTransactionBlock({
            transactionBlock,
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
              showObjectChanges: true,
            }
          });
      console.log("Draw Response", response)
      console.log("H " + attacking_player_hand_size);
      console.log("D: " + attacking_player_deck_size);

      return [attacking_player_hand_size, attacking_player_deck_size, 
        defending_player_hand_size, defending_player_deck_size];
    } catch (error) {
      console.log(error)
    }
  }

  export const discard = async(
    wallet: Wallet | undefined,
    game_id: string,
    id_card_to_discard: string,
  ) => {
    try{    
        let output: string = "";
        let alpha_string: string = "";
        let public_key: string = "";
        let proof: string = "";
        let vk: string = "";
        let public_inputs_bytes: string = "";
        let proof_points_bytes: string = "";
        let new_hand_commitment: string = "";
        let transactionBlock = new TransactionBlock();

        let index;
        let deck_size;
        let hand;
         // todo: fix if statement

         if(wallet?.address === JSON.parse(localStorage.getItem("player_1") || "[]")){
          // read deck size from game_struct
         hand = JSON.parse(localStorage.getItem("player_1_hand") || "[]");

         // add card to graveyard
         hand.push(id_card_to_discard); // id

         // remove card from hand
         index = hand.findIndex((card: string) => card === id_card_to_discard);
         hand.splice(index, 1);
         
         // update deck and hand in local storage
         localStorage.setItem("player_1_hand", JSON.stringify(hand));
          
         // graveryard already updated in contract
       }
       else{
        let index;
        let deck_size;
        let hand;
         // todo: fix if statement

          // read deck size from game_struct
         hand = JSON.parse(localStorage.getItem("player_2_hand") || "[]");

         // add card to graveyard
         hand.push(id_card_to_discard); // id

         // remove card from hand
         index = hand.findIndex((card: string) => card === id_card_to_discard);
         hand.splice(index, 1);
         
         // update deck and hand in local storage
         localStorage.setItem("player_2_hand", JSON.stringify(hand));
       }


        transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::discard`,
            arguments: [
                transactionBlock.object(game_id),
                transactionBlock.pure(output),
                transactionBlock.pure(alpha_string),
                transactionBlock.pure(public_key),
                transactionBlock.pure(proof),
                transactionBlock.pure(vk),
                transactionBlock.pure(public_inputs_bytes),
                transactionBlock.pure(proof_points_bytes),
                transactionBlock.object(id_card_to_discard),
                transactionBlock.pure(new_hand_commitment),
            ]
        })
       let response = await wallet?.signAndExecuteTransactionBlock({
        transactionBlock,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true,
        }
      });
      console.log(response);
    } catch (error) {
        console.log(error)
    }
}
  export const play = async (
    wallet: Wallet | undefined,
    game_id: string,
    id_card_to_play: string,
    ) => {
    if (!wallet) return
    try {
      let output: string = "";
      let alpha_string: string = "";
      let public_key: string = "";
      let proof: string = "";
      let vk: string = "";
      let public_inputs_bytes: string = "";
      let proof_points_bytes: string = "";
      let new_hand_commitment: string = "";


      // find id of card to play in localStorage



      let transactionBlock = new TransactionBlock();
        let tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::play`,
            arguments: [
                transactionBlock.object(game_id),
                transactionBlock.pure(output),
                transactionBlock.pure(alpha_string),
                transactionBlock.pure(public_key),
                transactionBlock.pure(proof),
                transactionBlock.pure(vk),
                transactionBlock.pure(public_inputs_bytes),
                transactionBlock.pure(proof_points_bytes),
                transactionBlock.object(id_card_to_play),
                transactionBlock.pure(new_hand_commitment),
            ]
        });
        let response = await wallet?.signAndExecuteTransactionBlock({
            transactionBlock,
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
              showObjectChanges: true,
            }
          });
    
        console.log("Transaction Response", response)
    } catch (error) {
      console.log(error)
    }
  }

export const attack = async (
    wallet: Wallet | undefined,
    game_id: string,
    attacking_character_indices: number[],
    defending_character_indices: number[],
    direct_player_attacks: number[],
    ) => {
    if (!wallet) return
    try {
        // get the card ids of the attacking characters on board
        // based on index
        let attacking_card_ids = get_card_id_of_attacking_characters(attacking_character_indices);
        
      let transactionBlock = new TransactionBlock();
        let tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::attack`,
            arguments: [
                transactionBlock.object(game_id),
                transactionBlock.object(attacking_characters),
                transactionBlock.object(defending_characters),
                transactionBlock.pure(direct_player_attacks)
            ]
        });
        let response = await wallet?.signAndExecuteTransactionBlock({
            transactionBlock,
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
              showObjectChanges: true,
            }
          });
        console.log("Transaction Response", response)

        await listen_for_events();
              /*
      if(event.winner == wallet.address){
        window.alert("You won!");
      }
      */
    } catch (error) {
      console.log(error)
    }
}

export const end_turn = async (
    wallet: Wallet | undefined,
    game_id: string
    ) => {
    if (!wallet) return
    try {
      let transactionBlock = new TransactionBlock();
        let tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::end_turn`,
            arguments: [
                transactionBlock.object(game_id),
            ]
        });
        let response = await wallet?.signAndExecuteTransactionBlock({
            transactionBlock,
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
              showObjectChanges: true,
            }
          });
    
        console.log("Transaction Response", response)
    } catch (error) {
      console.log(error)
    }
  }

export const surrender = async (wallet: Wallet | undefined, game_id: string) => {
    if (!wallet) return
    try {
      const transactionBlock = new TransactionBlock();
      const tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::surrender`,
        arguments: [
          transactionBlock.object(game_id),
        ]
      });
      const response = await wallet?.signAndExecuteTransactionBlock({
        transactionBlock,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showBalanceChanges: true,
          showObjectChanges: true,
        }
      });
      console.log("Transaction Response", response)
      /*
      if(event.winner == wallet.address){
        window.alert("You won!");
      }
      */
    //   setIsLoading(false);
    //   router.push("/");
    } catch (error) {
      console.log(error)
    }
}

export const get_game_struct = async (wallet: Wallet | undefined, game_id: string) => {
  try {
    const transactionBlock = new TransactionBlock();
    const [game] = transactionBlock.moveCall({
      target: `${MODULE_ADDRESS}::card_game::get_game`,
      arguments: [
        transactionBlock.object(game_id),
      ]
    });
    const response = await wallet?.signAndExecuteTransactionBlock({
      transactionBlock,
      options: {
        showInput: true,
        showEffects: true,
        showEvents: true,
        showBalanceChanges: true,
        showObjectChanges: true,
      }
    });
    console.log("Game Response", response)
  } catch (error) {
      console.log(error)
  }
}

export const generate_draw_proof_with_rust = async () => {
    try {
        let draw_proof: Proof = await generate_draw_proof();
        return draw_proof;
    } catch (error) {
        console.log(error)
    }
}

export const generate_discard_proof_with_rust = async () => {
    try {
        let discard_proof: Proof = await generate_discard_proof();
        return discard_proof;
    } catch (error) {
        console.log(error)
    }
}

