import { Box, Text, Flex, Link, VStack, Textarea, Spinner } from "@chakra-ui/react";
import NextLink from "next/link";
import {useState, useEffect, useCallback} from "react";
import {ethos, TransactionBlock, SignInButton} from "ethos-connect";
import { MODULE_ADDRESS } from "../constants";


export default function Challenges(){
    const { wallet } = ethos.useWallet();
    const [challengers, setChallengers] = useState<string[]>([]);
    const [challenges, setChallenges] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    async function getChallenges(){
        try{
            setIsLoading(true);
            const response = await fetch(
                `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "jsonrpc": "2.0",
                        "method": "suix_getOwnedObjects",
                        "params": [
                            wallet?.address,
                            {
                                "filter": {
                                    "MatchAll": [
                                        {
                                            "StructType": `${MODULE_ADDRESS}::card_game::Challenge`
                                        }
                                    ]
                                }
                            }
                        ],
                        "id": 1
                    })
                }
            );
            const data = await response.json();
            const tempChallenges = data.result.data.map((item: { data: { objectId: string } }) => item.data.objectId);
            setChallenges(tempChallenges);
            const tempChallengers = await Promise.all(
                tempChallenges.map((challengeId: string) => getChallengerFromId(challengeId))
            );
        
            console.log(tempChallengers);
            setChallengers(tempChallengers);
            setIsLoading(false);
        } catch (error) {
            console.log(error);
        }
    }

    async function getChallengerFromId(id: string){
        try{
            const response = await fetch(
                `https://api.shinami.com/node/v1/${process.env.NEXT_PUBLIC_ACCESS_TOKEN}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "jsonrpc": "2.0",
                        "method": "sui_getObject",
                        "params": [
                            id,
                            {
                                "showType": true,
                                "showOwner": true,
                                "showPreviousTransaction": true,
                                "showDisplay": false,
                                "showContent": true,
                                "showBcs": false,
                                "showStorageRebate": true
                              }
                        ],
                        "id": 1
                    })
                }
            );
            const data = await response.json();
            return data.result.data.content.fields.challenger;
        } catch (error) {
            console.log(error);
        }
    }

    // const accept_challenge = useCallback(async (challenge_id: string) => {
    //     if (!wallet) return
    
    //     try {
    //       setIsLoading(true);
    //       const transactionBlock = new TransactionBlock();
    //       const tx = transactionBlock.moveCall({
    //         target: `${MODULE_ADDRESS}::card_game::accept_challenge`,
    //         arguments: [
    //           transactionBlock.object(challenge_id),
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

    useEffect(() => {
        getChallenges();
    }, [])

    return (
        <Box textAlign="center">
          <Text fontSize="4xl" fontWeight="bold" mt={4}>
            Challenges
          </Text>
          <Box>
            <VStack spacing="20px">
              {isLoading ? (
                <Spinner size="xl" />
              ) : (
                challenges.map((challenge, index) => (
                  <NextLink key={index} href={`/game/${challenge}`} passHref>
                    <Link
                      width="200%"
                      minHeight="100px"
                      onClick={() => accept_challenge(challenge)}
                    >
                      Challenger: {challengers[index]}
                    </Link>
                  </NextLink>
                ))
              )}
            </VStack>
          </Box>
        </Box>
      );
    }