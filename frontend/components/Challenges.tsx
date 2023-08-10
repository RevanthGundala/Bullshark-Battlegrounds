import { Box, Text, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import {useState} from "react";
import {ethos} from "ethos-connect";


export default function Challenges(){
    const [ids, setIds] = useState<number[] | undefined>([]);
    const { status, wallet } = ethos.useWallet();

    if(!wallet) return <></>
    
    // const { suiBalance, tokens, nfts } = wallet.contents;

    return(
        <>
        <Box textAlign="center">
            <Text fontSize="4xl" fontWeight="bold" mt={4}>
            Challenges
            </Text>
        </Box>
        </>
        //     <Link as={NextLink} href=`/game/${id}` fontSize="2xl" fontWeight="bold" marginLeft="2rem">
        //     Game
        //   </Link>
    )
}