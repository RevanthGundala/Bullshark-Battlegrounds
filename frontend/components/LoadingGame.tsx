import { useState } from "react";
import { useRouter } from "next/router";
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

export default function LoadingGame({
  game_id,
  isModalOpen,
}: {
  game_id: string;
  isModalOpen: boolean;
}) {
  const router = useRouter();
  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={() => (isModalOpen = false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Match Accepted</ModalHeader>
          <ModalCloseButton />
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={() => router.push("/game/" + game_id)}
            >
              Enter Match
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
