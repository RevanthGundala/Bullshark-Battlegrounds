import { Box, Text, Flex, Link, VStack, Textarea } from "@chakra-ui/react";
import NextLink from "next/link";
import {useState, useEffect} from "react";
import {ethos, TransactionBlock} from "ethos-connect";


export default function Challenges(){
    const [ids, setIds] = useState<number[] | undefined>([]);
    const { status, wallet } = ethos.useWallet();
    const [challenges, setChallenges] = useState([]);

    if(!wallet) return <></>
    
    const { suiBalance, tokens, nfts } = wallet.contents;

    useEffect(() => {

    }, [wallet])

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
                        width="200%"
                        minHeight="100px"
                    >
                        <Link as={NextLink} href=`/game${challenge.id}` fontSize="2xl" fontWeight="bold" marginLeft="2rem">
                            {/*challenger address*/ challenge}
                        </Link> 
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