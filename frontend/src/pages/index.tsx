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
      <Box>
        <Box textAlign="center">
          <Text fontSize="5xl" fontWeight="bold" mt={4}>
            Bullshark Battlegrounds
          </Text>
          <Text mt={2} fontSize="2xl">
            Dive into strategic depths as players collide in the fierce currents
            of the Bullshark Battlegrounds
          </Text>
          <StartChallenge />
          <Challenges />
        </Box>
      </Box>
    </>
  );
}
