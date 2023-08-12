import { TransactionBlock, Wallet } from "ethos-connect";
import { MODULE_ADDRESS, GAME_ID, MAX_HAND_SIZE } from "./constants";

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
      console.log("Transaction Response", response)
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
      console.log("Transaction Response", response)
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
      console.log("Transaction Response", response)
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
        // output: string,
        // alpha_string: string,
        // public_key: string,
        // proof: string,
        // vk: string,
        // public_inputs_bytes: string,
        // proof_points_bytes: string,
        // new_hand_commitment: string
        let transactionBlock = new TransactionBlock();
       let tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::draw`,
        arguments: [
          transactionBlock.object(game_id),
          transactionBlock.pure(output),
          transactionBlock.pure(alpha_string),
          transactionBlock.pure(public_key),
          transactionBlock.pure(proof),
          transactionBlock.pure(vk),
          transactionBlock.pure(public_inputs_bytes),
          transactionBlock.pure(proof_points_bytes),
          transactionBlock.pure(new_hand_commitment),
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

      console.log("Transaction Response", response)
      /*
      if(event.winner == wallet.address){
        window.alert("You won!");
      }
      */
    } catch (error) {
      console.log(error)
    }
  }

  export const discard = async(
    wallet: Wallet | undefined,
    game_id: string,
  ) => {
    try{    

        // TODO: cache player hand #
        // if hand size > max_hand_size .. discard

        // output: string,
        // alpha_string: string,
        // public_key: string,
        // proof: string,
        // vk: string,
        // public_inputs_bytes: string,
        // proof_points_bytes: string,
        // card_to_discard: string,
        // new_hand_commitment: string
        let transactionBlock = new TransactionBlock();
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
                transactionBlock.object(card_to_discard),
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
    wallet: Wallet,
    game_id: string,
    output: string,
    alpha_string: string,
    public_key: string,
    proof: string,
    vk: string,
    public_inputs_bytes: string,
    proof_points_bytes: string,
    card_to_play: string,
    new_hand_commitment: string
    ) => {
    if (!wallet) return
    try {
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
                transactionBlock.object(card_to_play),
                transactionBlock.pure(new_hand_commitment),
            ]
        });
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
    } catch (error) {
      console.log(error)
    }
}

export const get_card_id_of_character = async(attacking_character_indices: number[]) => {
    const response = await fetch(

    )
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


export const get_object_ids = async (
    wallet: Wallet | undefined, 
    object_name: string): Promise<string[][]> => {
    try{
        const response = await fetch(
            `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "suix_getOwnedObjects",
                    "params": [
                        wallet?.address,
                        {
                            "filter": {
                                "MatchAll": [
                                    {
                                        "StructType": `${MODULE_ADDRESS}::card_game::${object_name}`
                                    }
                                ]
                            }
                        }
                    ],
                    "id": 1
                })
            }
        );
        const data = await response.json();
        const tempChallenges: string[] = data.result.data.map((item: { data: { objectId: string } }) => item.data.objectId);
        const tempChallengers: string[] = await Promise.all(
            tempChallenges.map((id: string) => get_objects_from_id(wallet, id, object_name))
        );
        return[tempChallenges, tempChallengers];
    } catch (error) {
        console.log(error);
        return [];
    }
}

export const get_objects_from_id = async (wallet: Wallet | undefined, 
    id: string, 
    object_name: string) => {
    try{
        const response = await fetch(
            `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "sui_getObject",
                    "params": [
                        id,
                        {
                            "showType": true,
                            "showOwner": true,
                            "showPreviousTransaction": true,
                            "showDisplay": false,
                            "showContent": true,
                            "showBcs": false,
                            "showStorageRebate": true
                          }
                    ],
                    "id": 1
                })
            }
        );
        const data = (await response.json()).result.data.content.fields;
        return object_name === "Challenge" ? data.challenger : data.game;
    } catch (error) {
        console.log(error);
    }
}

