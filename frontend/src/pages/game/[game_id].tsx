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
    const [player_1_hand_size, setPlayer_1_hand_size] = useState(6);
    const [player_1_deck_size, setPlayer_1_deck_size] = useState(6);
    const [player_2_hand_size, setPlayer_2_hand_size] = useState(STARTING_DECK_SIZE);
    const [player_2_deck_size, setPlayer_2_deck_size] = useState(STARTING_DECK_SIZE);
    const [player_1_hand, setPlayer_1_hand] = useState<string[]>([]);
    const [player_2_hand, setPlayer_2_hand] = useState<string[]>([])
    const [player_1_deck, setPlayer_1_deck] = useState([]);
    const [player_2_deck, setPlayer_2_deck] = useState([])
    const [player_1_board, setPlayer_1_board] = useState([]);
    const [player_2_board, setPlayer_2_board] = useState([])
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
      setIsLoading(true);
      setPlayer_1_hand(JSON.parse(localStorage.getItem("player1_hand") || "[]"));
      setPlayer_2_hand(JSON.parse(localStorage.getItem("player2_hand") || "[]"));
      setPlayer_1_deck(JSON.parse(localStorage.getItem("player1_deck") || "[]"));
      setPlayer_2_deck(JSON.parse(localStorage.getItem("player2_deck") || "[]"));

      // check if you own the game, else its not turn
      let x = await get_object_ids(wallet, "Game")
      // fetch board states from game struct
      setPlayer_1_board();
      setPlayer_2_board();

        if(turn){
          let [player_1_hand_size, player_1_deck_size, 
            player_2_hand_size, player_2_deck_size] = await draw(wallet, router.query.game_id as string);
          // setHandSize(hand_size);
          // setDeckSize(deck_size);
          if(player_1_hand_size > MAX_HAND_SIZE){
            await discard(wallet, router.query.game_id as string, "");
          }

          // select card to play



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
      setIsLoading(false);
    }

      useEffect(() => {
        checkTurn();
      }, [turn])

    return (
      <>
        {
          localStorage.getItem("player_1") == wallet?.address ? (
            <div></div>
          ) : (
            <div></div>
          )
        }
        
          <Box>
          {player_1_deck_size > 0 ? (
          <Image src="/images/cards/back.jpeg" 
          alt="your-deck" 
          height="200px"/>
        ) : (
          <Image></Image>
        )}
        {player_2_deck_size > 0 ? (
          <Image src="/images/cards/back.jpeg" 
          alt="enemy-deck" 
          height="200px"/>
        ) : (
          <Image></Image>
        )}
        <Box>
        <Button 
            colorScheme='yellow' isLoading={isLoading} onClick={() => 
              end_turn(wallet, router.query.game_id as string)} 
              disabled={isDisabled}>
                End Turn
        </Button>
        <Button colorScheme="red" isLoading={isLoading} 
            onClick={() => {
              surrender(wallet, router.query.game_id as string);
              router.push("/");
            }}>
                Surrender
        </Button>

        </Box>
          </Box>
      </>
    );
}


