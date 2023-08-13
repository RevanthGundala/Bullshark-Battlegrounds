import { Box, Text, Flex, Link, VStack, Textarea, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {useState, useEffect, useCallback} from "react";
import {ethos, TransactionBlock, SignInButton} from "ethos-connect";

import { accept_challenge, draw, get_game_struct } from "../calls/move_calls";
import { get_object_ids } from "../calls/api_calls";

export default function Challenges(){
    const { wallet } = ethos.useWallet();
    const [challengers, setChallengers] = useState<string[]>([]);
    const [challenges, setChallenges] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    console.log(wallet?.contents);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
              // fetch challenges
              setIsLoading(true);
              let [tempChallenges, tempChallengers]: string[][] = await get_object_ids(wallet, "Challenge");
              // Now you can use tempChallenges and tempChallengers in your component's state or other logic
              setChallenges(tempChallenges);
              setChallengers(tempChallengers);
            
              // check if we own a game object
              // todo: make it so we cant have multiple obj
              let data = await get_object_ids(wallet, "Game");
              /*
              if(data[0].length > 0){
                router.push(`/game/${data[0][0]}`)
              */

              setIsLoading(false);
            } catch (error) {
              console.log(error);
            }
          };
          fetchData();
      }, []);
      

    return (
        <Box textAlign="center">
          <Text fontSize="4xl" fontWeight="bold" mt={4}>
            Challenges
          </Text>
          <Box>
            <VStack spacing="20px">
              {isLoading || challenges === undefined ? (
                <Spinner size="xl">
                    <Text>Loading...</Text>
                    </Spinner>
              ) : (
                <Box>
                {challenges.map((challenge, index) => (
                      <Box key={index} onClick={
                        async () => {
                          let game_id = await accept_challenge(wallet, challenge);
                          router.push("/game/" + game_id);
                      }}>
                        Challenger: {ethos.truncateMiddle(challengers[index], 4)}
                        <br />
                      </Box>
                ))}
              </Box>
              )}
            </VStack>
          </Box>
        </Box>
      );
    }