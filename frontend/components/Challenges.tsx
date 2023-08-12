import { Box, Text, Flex, Link, VStack, Textarea, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import {useState, useEffect, useCallback} from "react";
import {ethos, TransactionBlock, SignInButton} from "ethos-connect";
import { MODULE_ADDRESS } from "../constants";
import { accept_challenge, get_object_ids } from "../move_calls";


export default function Challenges(){
    const { wallet } = ethos.useWallet();
    const [challengers, setChallengers] = useState<string[]>([]);
    const [challenges, setChallenges] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    
    useEffect(() => {
        const fetchData = async () => {
            try {
              let [tempChallenges, tempChallengers]: string[][] = await get_object_ids(wallet, "Challenge");
              // Now you can use tempChallenges and tempChallengers in your component's state or other logic
              setChallenges(tempChallenges);
              setChallengers(tempChallengers);
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
                <Spinner size="xl" />
              ) : (
                challenges?.map((challenge, index) => (
                  <NextLink key={index} href={`/game/${challenge}`} passHref>
                    <Link
                      width="200%"
                      minHeight="100px"
                      onClick={() => accept_challenge(
                        wallet, challenge
                        )}
                    >
                      Challenger: {ethos.truncateMiddle(challengers[index], 4)}
                    </Link>
                  </NextLink>
                ))
              )}
            </VStack>
          </Box>
        </Box>
      );
    }