import {useState, useEffect, useCallback} from 'react';
import { Box, Center, Container, Image, Button, ButtonGroup } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import {MODULE_ADDRESS, GAME_ID, MAX_HAND_SIZE} from "../../../constants/index";
import { draw, discard, play, attack, generate_discard_proof_with_rust, Proof, surrender, end_turn, get_object_ids } from '../../../move_calls';
export default function GamePage() {
    const [isLoading, setIsLoading] = useState(false);
    const {wallet} = ethos.useWallet();
    const [isDisabled, setIsDisabled] = useState(true);
    const [turn, setTurn] = useState(false);
    const [handSize, setHandSize] = useState(0);
    const router = useRouter(); 

    const fetchData = async () => {
      try {
        let [tempChallenges, tempChallengers]: string[][] = await get_object_ids(wallet, "Challenges");
        // Now you can use tempChallenges and tempChallengers in your component's state or other logic
      } catch (error) {
        console.log(error);
      }
    }
    async function checkTurn(){
        if(turn){
          await draw(wallet, router.query.game_id as string);
          if(handSize > MAX_HAND_SIZE){
            await discard(wallet, router.query.game_id as string);
          }
          setIsDisabled(false);
          setTurn(false);
      }
      else{
          setIsDisabled(true);
          // check for turn update
          // nft.contains(objectid)
          await fetchData();
          setTurn(true);
      }
    }
      useEffect(() => {
        checkTurn();
      }, [])
    return (
        <Box
        bgImage="url('/images/map.png')"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
        minH="100vh"
        >
            <Button colorScheme="red" isLoading={isLoading} onClick={() => 
            surrender(wallet, router.query.game_id as string)}>
                Surrender
            </Button>
            <Button colorScheme='yellow' isLoading={isLoading} onClick={() => 
              end_turn(wallet, router.query.game_id as string)} 
              disabled={isDisabled}>
                End Turn
            </Button>
        </Box>
    );
}
