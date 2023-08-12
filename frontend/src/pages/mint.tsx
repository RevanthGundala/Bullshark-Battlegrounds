import { useState, useEffect, useCallback } from "react";
import { Text, Box, Button } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Challenges from "../../components/Challenges";
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import { get_new_character } from "../../move_calls";

export default function Mint() {
    const [isLoading, setIsLoading] = useState(false);
    const {wallet} = ethos.useWallet();

    // const mint = useCallback(async () => {
    //     if (!wallet) return
    
    //     try {
    //       setIsLoading(true);
    //       const transactionBlock = new TransactionBlock();
    //       const tx = transactionBlock.moveCall({
    //         target: `${MODULE_ADDRESS}::card_game::get_new_character`,
    //         arguments: [
    //           transactionBlock.pure("Ethos Example NFT"),
    //           transactionBlock.pure("A sample NFT from Ethos Wallet."),
    //           transactionBlock.pure("https://ethoswallet.xyz/assets/images/ethos-email-logo.png"),
    //           transactionBlock.pure(1),
    //           transactionBlock.pure(1),
    //         ]
    //       });
    
    //       const response = await wallet.signAndExecuteTransactionBlock({
    //         transactionBlock,
    //         options: {
    //           showInput: true,
    //           showEffects: true,
    //           showEvents: true,
    //           showBalanceChanges: true,
    //           showObjectChanges: true,
    //         }
    //       });
    
    //       console.log("Transaction Response", response)
    //       setIsLoading(false);
    //     } catch (error) {
    //       console.log(error)
    //     }
    //   }, [wallet])

    // TODO: Generate random name + description
    return (
        <>
          <Navbar />
          <Box textAlign="center">
            <Text fontSize="5xl" fontWeight="bold" mt={4}>
              Let's get you some cards to play with!
            </Text>
            <Button colorScheme="blue" isLoading={isLoading} onClick={() => 
              get_new_character(
                wallet, "Narwhal", "Test-NFT", "", 1, 1
                )}>
                Generate card
            </Button>
          </Box>
        </>
      );
}