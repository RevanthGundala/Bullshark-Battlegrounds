import { useState, useEffect, useCallback } from "react";
import { Box, Textarea, IconButton, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from "@chakra-ui/react";
import {ethos, EthosConnectStatus, TransactionBlock} from "ethos-connect";
import {MODULE_ADDRESS} from "../constants/index";

export default function StartChallenge() {
    const [isLoading, setIsLoading] = useState(false);
    const {wallet} = ethos.useWallet();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [opponent, setOpponent] = useState("");

    const start_challenge = useCallback(async () => {
        if (!wallet) return
    
        try {
          setIsLoading(true);
          const transactionBlock = new TransactionBlock();
          const tx = transactionBlock.moveCall({
            target: `${MODULE_ADDRESS}::card_game::challenge_person`,
            arguments: [
              transactionBlock.pure(opponent, "address"),
            ]
          });
    
          const response = await wallet.signAndExecuteTransactionBlock({
            transactionBlock,
            options: {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showBalanceChanges: true,
              showObjectChanges: true,
            }
          });
    
          console.log("Transaction Response", response)
          setIsLoading(false);
        } catch (error) {
          console.log(error)
        }
      }, [wallet])

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
            <Button colorScheme="blue" onClick={start_challenge} isLoading={isLoading}>
              Challenge
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
        </Box>
        </>
      );
      
}