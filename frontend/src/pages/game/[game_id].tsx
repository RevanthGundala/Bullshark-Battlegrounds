import {useState, useEffect} from 'react';
import { Box, Center, Container, Image, Button, ButtonGroup } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function GamePage() {

    const [isLoading, setIsLoading] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const router = useRouter();

    async function end_turn(){
        setIsLoading(true);
        setIsLoading(false);
    }
    
    async function surrender(){
        setIsLoading(true);
        
        router.push("/");
        setIsLoading(false);
    }

    return (
        <Box
        bgImage="url('/images/map.png')"
        bgPosition="center"
        bgRepeat="no-repeat"
        bgSize="cover"
        minH="100vh"
        >
            <Button colorScheme="green" onClick={end_turn} isLoading={isLoading}>
                End Turn
            </Button>
            <Button colorScheme="red" isLoading={isLoading} onClick={surrender}>
                Surrender
            </Button>
        </Box>
    );
}
