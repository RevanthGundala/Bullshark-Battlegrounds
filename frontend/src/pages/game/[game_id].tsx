import {useState, useEffect, useCallback} from 'react';
import { Box, Center, Container, Image, Button, ButtonGroup, Flex, Grid, GridItem} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import {MODULE_ADDRESS, MAX_HAND_SIZE, STARTING_DECK_SIZE} from "../../../constants/index";
import { draw, discard, play, attack, generate_discard_proof_with_rust, Proof, surrender, end_turn } from '../../../calls/move_calls';
import {get_object_ids} from '../../../calls/api_calls';

export default function GamePage() {
    const [isLoading, setIsLoading] = useState(false);
    const {wallet} = ethos.useWallet();
    const [isDisabled, setIsDisabled] = useState(true);
    const [turn, setTurn] = useState(false);
    const [directPlayerAttacks, setDirectPlayerAttacks] = useState<number[]>([]);
    const [attacking_player_hand_size, setAttacking_player_hand_size] = useState(0);
    const [attacking_player_deck_size, setAttacking_player_deck_size] = useState(0);
    const [defending_player_hand_size, setDefending_player_hand_size] = useState(STARTING_DECK_SIZE);
    const [defending_player_deck_size, setDefending_player_deck_size] = useState(STARTING_DECK_SIZE);
    const router = useRouter(); 

    const fetchData = async () => {
      // try {
      //   let [tempChallenges, tempChallengers]: string[][] = await get_object_ids(wallet, "Challenges");
      //   // Now you can use tempChallenges and tempChallengers in your component's state or other logic
      // } catch (error) {
      //   console.log(error);
      // }
      console.log("fetching data");
      console.log(turn);
    }
    async function checkTurn(){
      // check if you own the game, else its not turn
      let x = await get_object_ids(wallet, "Game");

        if(turn){
          let [attacking_player_hand_size, attacking_player_deck_size, 
            defending_player_hand_size, defending_player_deck_size] = await draw(wallet, router.query.game_id as string);
          // setHandSize(hand_size);
          // setDeckSize(deck_size);
          if(handSize > MAX_HAND_SIZE){
            await discard(wallet, router.query.game_id as string, "");
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
      <>
          <h1 className="text-3xl font-bold">
            Game Page
        </h1>
      </>
    );
}


