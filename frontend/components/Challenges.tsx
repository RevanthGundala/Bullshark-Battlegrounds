import { Box, Text, Flex, Link, VStack, Textarea } from "@chakra-ui/react";
import NextLink from "next/link";
import {useState, useEffect} from "react";
import {ethos, TransactionBlock} from "ethos-connect";


export default function Challenges(){
    const [ids, setIds] = useState<number[] | undefined>([]);
    const { status, wallet } = ethos.useWallet();
    const [challenges, setChallenges] = useState([]);
    const MODULE_ADDRESS = "";

    if(!wallet) return <></>
    
    const { suiBalance, tokens, nfts } = wallet.contents;



    async function getChallenges(){
        
    }

    useEffect(() => {

    }, [])

    return(
        <>
        <Box textAlign="center">
            <Text fontSize="4xl" fontWeight="bold" mt={4}>
            Challenges
            </Text>
            <Box>
                <VStack spacing="20px">
                    {challenges.map((challenge, index) => (
                    <Textarea
                        key={index}
                        value={`Challenger: ${challenge}`}
                        readOnly={true}
                        width="200%"
                        resize={"none"}
                        minHeight="100px"
                    >
                        {/* <Link as={NextLink} href=`/game${}` fontSize="2xl" fontWeight="bold" marginLeft="2rem">
                            { /*challenger address*/ challenge}
                        </Link> */}
                    </Textarea>
                    ))}
                </VStack>
            </Box>
        </Box>
        </>
        //     <Link as={NextLink} href=`/game/${id}` fontSize="2xl" fontWeight="bold" marginLeft="2rem">
        //     Game
        //   </Link>
    )
}