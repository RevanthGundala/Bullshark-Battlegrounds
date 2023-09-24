import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Textarea,
  IconButton,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { ethos, EthosConnectStatus, TransactionBlock } from "ethos-connect";
import { challenge_person } from "../calls/move_calls";

export default function StartChallenge() {
  const [isLoading, setIsLoading] = useState(false);
  const { wallet } = ethos.useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [opponent, setOpponent] = useState("");

  return (
    <>
      <Box textAlign="center">
        <Button colorScheme="blue" onClick={() => setIsModalOpen(true)}>
          Challenge Someone!
        </Button>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Start Challenge</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Textarea
                placeholder="Enter your opponent's address"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                resize="vertical"
                minHeight="100px"
              />
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="blue"
                onClick={async () => {
                  if (wallet) {
                    await challenge_person(wallet, opponent);
                    setIsModalOpen(false);
                  }
                }}
                isLoading={isLoading}
              >
                Challenge
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}
