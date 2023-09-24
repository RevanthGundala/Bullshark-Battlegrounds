import { useState, useEffect, useCallback } from "react";
import { Text, Box, Button } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Challenges from "../../components/Challenges";
import { ethos, EthosConnectStatus, TransactionBlock } from "ethos-connect";
import { get_new_character } from "../../calls/move_calls";

export default function Mint() {
  const [isLoading, setIsLoading] = useState(false);
  const { wallet } = ethos.useWallet();

  if (wallet === undefined) {
    return <></>;
  }
  return (
    <>
      <Navbar />
      <div className="min-h-screen h-screen bg-[url('/images/map.png')] bg-cover bg-center">
        <Box textAlign="center">
          <Text fontSize="5xl" fontWeight="bold">
            Let's get you some cards to play with!
          </Text>
          <Button
            colorScheme="blue"
            isLoading={isLoading}
            onClick={async () => {
              setIsLoading(true);
              await get_new_character(wallet);
              setIsLoading(false);
            }}
          >
            Generate cards
          </Button>
        </Box>
      </div>
    </>
  );
}
