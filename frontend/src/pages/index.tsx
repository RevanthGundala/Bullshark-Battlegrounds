import { useState, useEffect } from "react";
import { Text, Box } from "@chakra-ui/react";
import Navbar from "../../components/Navbar";
import Challenges from "../../components/Challenges";
import {ethos, EthosConnectStatus} from "ethos-connect";
import StartChallenge from "../../components/StartChallenge";


export default function Home() {
  
  return (
    <>
      <Navbar />
      <Box 
       bgImage="url('/images/lobby.png')"
       bgPosition="center"
       bgRepeat="no-repeat"
       bgSize="cover"
       minH="100vh">
      <Box textAlign="center">
        <Text fontSize="5xl" fontWeight="bold" mt={4}>
          Bullshark Battlegrounds
        </Text>
        <Text mt={2} fontSize="2xl">
        Dive into strategic depths as players collide in the fierce currents of the Bullshark Battlegrounds
        </Text>
        {/* <Challenges /> */}
        <StartChallenge />
      </Box>
      </Box>
    </>
  );
}
