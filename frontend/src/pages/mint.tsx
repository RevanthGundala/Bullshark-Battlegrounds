import { useState, useEffect, useCallback } from "react";
import { Text, Box, Button } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Challenges from "../../components/Challenges";
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import { get_new_character } from "../../calls/move_calls";
import { get_new_character_gasless } from "../../calls/functions";
import { NFTS } from "../../constants";

export default function Mint() {
    const [isLoading, setIsLoading] = useState(false);
    const {wallet} = ethos.useWallet();

    if(wallet === undefined){
      return(
        <>
        </>
      )
    }
    // TODO: Generate random name + description
    return (
        <>
          <Navbar />
          <Box textAlign="center">
            <Text fontSize="5xl" fontWeight="bold" mt={4}>
              Let's get you some cards to play with!
            </Text>
            <Button colorScheme="blue" isLoading={isLoading} 
            onClick={() => {
              setIsLoading(true);
              NFTS.forEach((nft) => {
                get_new_character_gasless(wallet, nft.name, nft.description, nft.image, Math.floor(Math.random() * 5), Math.floor(Math.random() * 5));
              });
              setIsLoading(false);
            }}>
                Generate card
            </Button>
          </Box>
        </>
      );
}