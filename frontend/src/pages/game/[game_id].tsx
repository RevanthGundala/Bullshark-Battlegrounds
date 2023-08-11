import {useState, useEffect, useCallback} from 'react';
import { Box, Center, Container, Image, Button, ButtonGroup } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import {MODULE_ADDRESS, GAME_ID} from "../../../constants/index";

export default function GamePage() {
    const [isLoading, setIsLoading] = useState(false);
    const {wallet} = ethos.useWallet();
    const [isDisabled, setIsDisabled] = useState(true);
    const [turn, setTurn] = useState(false);
    const router = useRouter();
    
    const surrender = useCallback(async () => {
        if (!wallet) return
    
        try {
          setIsLoading(true);
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
          setIsLoading(false);
          router.push("/");
        } catch (error) {
          console.log(error)
        }
      }, [wallet])

      const end_turn = useCallback(async () => {
        if (!wallet) return
    
        try {
          setIsLoading(true);
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
          setIsLoading(false);
        } catch (error) {
          console.log(error)
        }
      }, [wallet])

      const draw_and_discard = useCallback(async () => {
        if (!wallet) return
    
        try {
          setIsLoading(true);
          let transactionBlock = new TransactionBlock();
            let [attacking_player, _] = transactionBlock.moveCall({
                target: `${MODULE_ADDRESS}::card_game::get_players`,
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
          setIsLoading(false);
        } catch (error) {
          console.log(error)
        }
      }, [wallet])

      const attack = useCallback(async () => {
        if (!wallet) return
    
        try {
          setIsLoading(true);
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
          setIsLoading(false);
        } catch (error) {
          console.log(error)
        }
      }, [wallet])

      useEffect(() => {
        if(turn){
            draw_and_discard();
            setIsDisabled(false);
        }
        else{
            setIsDisabled(true);
        }
      }, [])
    return (
        <Box
        bgImage="url('/images/map.png')"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
        minH="100vh"
        >
            <Button colorScheme="red" isLoading={isLoading} onClick={surrender}>
                Surrender
            </Button>
            <Button colorScheme='yellow' isLoading={isLoading} onClick={end_turn} disabled={isDisabled}>
                End Turn
            </Button>
        </Box>
    );
}
