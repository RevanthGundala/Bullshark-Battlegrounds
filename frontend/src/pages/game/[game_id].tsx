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
    const [isWaitingForUser, setIsWaitingForUser] = useState(false);
    
    const [is_player_1, setIs_player_1] = useState(false);
    const [is_player_1_turn, setIs_player_1_turn] = useState(false);

    const [player_1_hand, setPlayer_1_hand] = useState<Card[]>([]);
    const [player_2_hand, setPlayer_2_hand] = useState<Card[]>([]);

    const [player_1_deck, setPlayer_1_deck] = useState<Card[]>([]);
    const [player_2_deck, setPlayer_2_deck] = useState<Card[]>([]);

    const [player_1_board, setPlayer_1_board] = useState<Card[]>([]);
    const [player_2_board, setPlayer_2_board] = useState<Card[]>([]);

    const [directPlayerAttacks, setDirectPlayerAttacks] = useState<number>(0);

    const [selected_card_to_discard, setSelected_card_to_discard] = useState<Card | null>(null);
    const [selected_card_to_play, setSelected_card_to_play] = useState<Card | null>(null);
    const [selected_cards_to_attack, setSelected_cards_to_attack] = useState<Card[] | null>(null);
    const [selected_cards_to_defend, setSelected_cards_to_defend] = useState<Card[] | null>(null);

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

    async function discard_card(){
        setIsWaitingForUser(true);
        if(selected_card_to_discard){
          await discard(wallet, router.query.game_id as string, selected_card_to_discard.id || "1");
          update_state_from_local_storage();
          await update_board_state();
        }
        setIsWaitingForUser(false);
    }

    async function play_card(){
        setIsWaitingForUser(true);
        // todo: open modal and allow user to choose card to play
        if(selected_card_to_play){
          await play(wallet, router.query.game_id as string, selected_card_to_play.id || "1");
          update_state_from_local_storage();
          await update_board_state();
        }
        setIsWaitingForUser(false);
    }

    async function attack_opponent(){
      setIsWaitingForUser(true);
      if(is_player_1){
          if(selected_cards_to_attack && selected_cards_to_defend){
            let game_over = await attack(wallet, router.query.game_id as string, 
              selected_cards_to_attack.map((character: Card) => character.id), // attacking character ids
              selected_cards_to_defend.map((character: Card) => character.id),
              directPlayerAttacks
            );
            await update_board_state();
            if(game_over){
              window.alert("You won!");
              router.push("/");
            }
          }
      }
      else{
        if(selected_cards_to_attack && selected_cards_to_defend){
          let game_over = await attack(wallet, router.query.game_id as string, 
            selected_cards_to_attack.map((character: Card) => character.id), // attacking character ids
            selected_cards_to_defend.map((character: Card) => character.id),
            directPlayerAttacks
          );
          await update_board_state();
          if(game_over){
            window.alert("You won!");
            router.push("/");
          }
        }
      }
      setIsWaitingForUser(false);
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
            await discard_card();
          }
          await play_card();
          await attack_opponent();
          setisAttacking(false);
        }
        else{
          setIsDisabled(true);
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
            await discard_card();
          }         
          await play_card();
          await attack_opponent();
          setisAttacking(false);
        }
        else{
          setIsDisabled(true);
          if(!isAttacking){
            await update_board_state();
            setIs_player_1_turn(true);
          }
        }
    }
  }

    // useEffect(() => {
    //   const player1FromLocalStorage = localStorage.getItem("player_1");
    //   setIs_player_1(
    //     wallet?.address !== null &&
    //     player1FromLocalStorage !== null &&
    //     wallet?.address === JSON.parse(player1FromLocalStorage));
    //   turn_logic();
    // }, [is_player_1_turn])

    return (
      <>
          {is_player_1_turn ? (
              is_player_1 ? (
                  <>
                      {/* Logic for player 1's turn */}
                      {/* Call your functions here */}
                  </>
              ) : (
                  <>
                      {/* Logic for player 2's turn */}
                      <div className={"min-h-screen bg-blue-900 flex flex-col items-center "}>
{/* Main Div */}
<div className="grid grid-rows-5 min-h-screen w-4/5 gap-2">
  {/* FIRST DIV */}
  <div className="grid grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2 ">
    <div></div>
    <div className="w-full h-full p-2 bg-blue-800 ">CARD 1</div>
    <div className="w-full h-full p-2 bg-blue-800 ">CARD 2</div>
    <div className="w-full h-full p-2 bg-blue-800 ">CARD 3</div>
    <div className="w-full h-full p-2 bg-blue-800 ">CARD 4</div>
    <div className="w-full h-full p-2 bg-blue-800 ">CARD 5</div>
    <div className="w-full h-full p-2 bg-blue-800 ">CARD 6</div>
    <div className="w-full h-full p-2 bg-blue-800 ">
    {player_1_hand.length > 0 ? (
      <Image src="/images/cards/back.jpeg" 
      alt="enemy-deck" />
    ) : (
      <Image></Image>
    )}
    </div>
  </div>
  {/* Second Div */}
  <div className="h-full  grid grid-rows-5 items-center row-span-3 gap-2 ">
    <div className="grid row-span-2 grid-cols-8 w-full min-h-full bg-blue-500 gap-2 p-2">
      <div></div>
      <div className="w-full h-full p-2 bg-blue-800 ">CARD 1</div>
      <div className="w-full h-full p-2 bg-blue-800 ">CARD 2</div>
      <div className="w-full h-full p-2 bg-blue-800 ">CARD 3</div>
      <div className="w-full h-full p-2 bg-blue-800 ">CARD 4</div>
      <div className="w-full h-full p-2 bg-blue-800 ">CARD 5</div>
      <div className="w-full h-full p-2 bg-blue-800 ">CARD 6</div>
      <div className="w-full h-full p-2 bg-blue-800 "></div>
    </div>
    <div className="grid grid-cols-3 min-h-full bg-orange-400 w-full items-center">
      <div className="flex justify-center ">
      <Button 
        colorScheme='yellow' isLoading={isAttacking} onClick={() => 
          end_turn(wallet, router.query.game_id as string)} 
          disabled={isDisabled}>
            End Turn
    </Button>
      </div>
      <div className="flex justify-center"></div>
      <div className="flex justify-center ">
      <Button colorScheme="red" isLoading={isAttacking} 
      onClick={() => {
        surrender(wallet, router.query.game_id as string);
        router.push("/");
      }}>
          Surrender
    </Button>
      </div>
    </div>

    <div className="grid grid-cols-8 w-full min-h-full bg-green-500 row-span-2 p-2 gap-2 ">
      <div className="w-full h-full p-2 bg-green-800 "></div>
      <div className="w-full h-full p-2 bg-green-800 ">CARD 2</div>
      <div className="w-full h-full p-2 bg-green-800 ">CARD 3</div>
      <div className="w-full h-full p-2 bg-green-800 ">CARD 4</div>
      <div className="w-full h-full p-2 bg-green-800 ">CARD 5</div>
      <div className="w-full h-full p-2 bg-green-800 ">CARD 6</div>
      <div className="w-full h-full p-2 bg-green-800 "></div>
      <div></div>
    </div>
  </div>
  {/* Third Div */}
  <div className="grid grid-cols-8 w-full min-h-full bg-green-500 p-2 gap-2 ">
    <div className="w-full h-full p-2 bg-green-800 ">
    <Image src="/images/cards/back.jpeg" alt="your-deck" />
    </div>
    <div className="w-full h-full p-2 bg-green-800 ">CARD 2</div>
    <div className="w-full h-full p-2 bg-green-800 ">CARD 3</div>
    <div className="w-full h-full p-2 bg-green-800 ">CARD 4</div>
    <div className="w-full h-full p-2 bg-green-800 ">CARD 5</div>
    <div className="w-full h-full p-2 bg-green-800 ">CARD 6</div>
    <div className="w-full h-full p-2 bg-green-800 ">CARD 7</div>
    <div></div>
  </div>
</div>
</div>

                  </>
              )
          ) : (
              !is_player_1 ? (
                  <>
                      {/* Logic for player 2's turn */}
                      {/* Call your functions here */}
                  </>
              ) : (
                  <>
                      {/* Logic for not player 2's turn */}
                      {/* Call your functions here */}
                  </>
              )
          )}
  
          {/* Rest of your JSX */}
      </>
  );
  
}

