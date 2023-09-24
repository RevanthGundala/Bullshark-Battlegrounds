import { useState, useEffect } from "react";
import { Text, Box } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Challenges from "../../components/Challenges";
import { ethos, EthosConnectStatus, Wallet } from "ethos-connect";
import StartChallenge from "../../components/StartChallenge";
import { MODULE_ADDRESS } from "../../constants";
import { get_object_from_id } from "../../calls/api_calls";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen h-screen bg-[url('/images/map.png')] bg-cover bg-center">
        <Box>
          <Box textAlign="center">
            <Text fontSize="5xl" fontWeight="bold">
              Bullshark Battlegrounds
            </Text>
            <Text my={2} fontWeight="bold" fontSize="2xl">
              Dive into strategic depths as players collide in the fierce
              currents of the Bullshark Battlegrounds
            </Text>
            <StartChallenge />
            <Challenges />
          </Box>
        </Box>
      </div>
    </>
  );
}
