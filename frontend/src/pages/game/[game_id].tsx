import {useState, useEffect, useCallback} from 'react';
import { Box, Center, Container, Image, Button, ButtonGroup, Flex, Grid, GridItem} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import {MODULE_ADDRESS, MAX_HAND_SIZE, STARTING_DECK_SIZE, Card} from "../../../constants/index";
import { draw, discard, play, attack, generate_discard_proof_with_rust, Proof, surrender, end_turn } from '../../../calls/move_calls';
import {get_object_ids} from '../../../calls/api_calls';

export default function GamePage() {
    const {wallet} = ethos.useWallet();

    const [isDisabled, setIsDisabled] = useState(true);
    const [isAttacking, setisAttacking] = useState(false);
    
    const [is_player_1, setIs_player_1] = useState(false);
    const [is_player_1_turn, setIs_player_1_turn] = useState(false);

    const [player_1_hand, setPlayer_1_hand] = useState<Card[]>([]);
    const [player_2_hand, setPlayer_2_hand] = useState<Card[]>([]);

    const [player_1_deck, setPlayer_1_deck] = useState<Card[]>([]);
    const [player_2_deck, setPlayer_2_deck] = useState<Card[]>([]);

    const [player_1_board, setPlayer_1_board] = useState<Card[]>([]);
    const [player_2_board, setPlayer_2_board] = useState<Card[]>([]);

    const [directPlayerAttacks, setDirectPlayerAttacks] = useState<number>(0);

    const router = useRouter(); 

    function update_state_from_local_storage(){
      setPlayer_1_hand(JSON.parse(localStorage.getItem("player1_hand") || "[]"));
      setPlayer_2_hand(JSON.parse(localStorage.getItem("player2_hand") || "[]"));

      setPlayer_1_deck(JSON.parse(localStorage.getItem("player1_deck") || "[]"));
      setPlayer_2_deck(JSON.parse(localStorage.getItem("player2_deck") || "[]"));
    }

    async function update_board_state(){
       // check if you own the game, else its not turn
       let x = await get_object_ids(wallet, "Game")

       // fetch board states from game struct
       setPlayer_1_board(); // player1.board 
       setPlayer_2_board(); // player2.board
    }

    async function turn_logic(){
      setisAttacking(true);
      update_state_from_local_storage();
      await update_board_state();

      if(is_player_1_turn){
        if(is_player_1){
          await draw(wallet, router.query.game_id as string);
          update_state_from_local_storage();
          if(player_1_hand.length > MAX_HAND_SIZE){
            // todo: open modal and allow user to choose card to discard
            await discard(wallet, router.query.game_id as string, "1");
            update_state_from_local_storage();
          }
          // todo: open modal and allow user to choose card to play
          await play(wallet, router.query.game_id as string, "1");
          update_state_from_local_storage();
          await update_board_state();

          // todo: open modal and allow user to make attacks on enemy board
          // first map into id string, and then allow user to make choice
          // before passing into func
          let game_over = await attack(wallet, router.query.game_id as string, 
            player_1_board.map((character: Card) => character.id), // attacking character ids
            player_2_board.map((character: Card) => character.id),
            directPlayerAttacks
          );
          await update_board_state();
          if(game_over){
            window.alert("You won!");
            router.push("/");
          }
          setisAttacking(false);
        }
        else{
          if(!isAttacking){
            await update_board_state();
            setIs_player_1_turn(false);
          }
        }
    }
    // player 2's turn
    else{
        if(!is_player_1){
          await draw(wallet, router.query.game_id as string);
          update_state_from_local_storage();
          if(player_2_hand.length > MAX_HAND_SIZE){
            // todo: open modal and allow user to choose card to discard
            await discard(wallet, router.query.game_id as string, "1");
            update_state_from_local_storage();
          }
          // todo: open modal and allow user to choose card to play
          await play(wallet, router.query.game_id as string, "1");
          update_state_from_local_storage();
          await update_board_state();

          // todo: open modal and allow user to make attacks on enemy board
          // first map into id string, and then allow user to make choice
          // before passing into func
          let game_over = await attack(wallet, router.query.game_id as string, 
            player_2_board.map((character: Card) => character.id), // attacking character ids
            player_1_board.map((character: Card) => character.id),
            directPlayerAttacks
          );
          await update_board_state();
          if(game_over){
            window.alert("You won!");
            router.push("/");
          }
          setisAttacking(false);
        }
        else{
          if(!isAttacking){
            await update_board_state();
            setIs_player_1_turn(true);
          }
        }
    }
  }

    useEffect(() => {
      const player1FromLocalStorage = localStorage.getItem("player_1");
      setIs_player_1(
        wallet?.address !== null &&
        player1FromLocalStorage !== null &&
        wallet?.address === JSON.parse(player1FromLocalStorage));
      turn_logic();
    }, [is_player_1_turn])

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
          {player_1_hand.length > 0 ? (
          <Image src="/images/cards/back.jpeg" 
          alt="your-deck" 
          height="200px"/>
        ) : (
          <Image></Image>
        )}
        {player_2_hand.length > 0 ? (
          <Image src="/images/cards/back.jpeg" 
          alt="enemy-deck" 
          height="200px"/>
        ) : (
          <Image></Image>
        )}
        <Box>
        <Button 
            colorScheme='yellow' isLoading={isAttacking} onClick={() => 
              end_turn(wallet, router.query.game_id as string)} 
              disabled={isDisabled}>
                End Turn
        </Button>
        <Button colorScheme="red" isLoading={isAttacking} 
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


