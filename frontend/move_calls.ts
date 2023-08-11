import { TransactionBlock, Wallet } from "ethos-connect";
import { MODULE_ADDRESS, GAME_ID, MAX_HAND_SIZE } from "./constants";

export const get_new_character = async (
    wallet: Wallet,
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

export const challenge_person = async (wallet: Wallet, opponent: string) => {
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
export const accept_challenge = async (wallet: Wallet, challenge_id: string) => {
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

 export const draw_and_discard = async (wallet: Wallet, game_id: string) => {
    if (!wallet) return
    try {
      let transactionBlock = new TransactionBlock();
        let [attacking_player, _] = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::get_players`,
            arguments: [
                transactionBlock.object(game_id),
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
        transactionBlock = new TransactionBlock();
       let tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::draw`,
        arguments: [
          transactionBlock.object(GAME_ID),

        ]
      });
      if(attacking_player?.hand_size > MAX_HAND_SIZE){
        transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::discard`,
            arguments: [
                transactionBlock.object(GAME_ID),
            ]
        })
      }
       response = await wallet.signAndExecuteTransactionBlock({
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
  export const play = async (wallet: Wallet) => {
    if (!wallet) return
    try {
      let transactionBlock = new TransactionBlock();
        let tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::play`,
            arguments: [
                transactionBlock.object(GAME_ID),
                transactionBlock.pure(),
                transactionBlock.pure(),
                transactionBlock.pure(),
                transactionBlock.pure(),
                transactionBlock.pure(),
                transactionBlock.pure(),
                transactionBlock.object(),
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

  export const attack = async (wallet: Wallet) => {
    if (!wallet) return

    try {
      let transactionBlock = new TransactionBlock();
        let tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::attack`,
            arguments: [
                transactionBlock.object(GAME_ID),
                transactionBlock.object(),
                transactionBlock.object(),
                transactionBlock.pure()
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

  export const end_turn = async (wallet: Wallet) => {
    if (!wallet) return
    try {
      let transactionBlock = new TransactionBlock();
        let tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::end_turn`,
            arguments: [
                transactionBlock.object(GAME_ID),
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


export const surrender = async (wallet: Wallet) => {
    if (!wallet) return

    try {
      const transactionBlock = new TransactionBlock();
      const tx = transactionBlock.moveCall({
        target: `${MODULE_ADDRESS}::card_game::surrender`,
        arguments: [
          transactionBlock.object(GAME_ID),
        ]
      });
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



