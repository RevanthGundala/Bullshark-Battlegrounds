import { Box, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { ethos, EthosConnectStatus, SignInButton } from 'ethos-connect'

export default function Navbar() {

    const {status, wallet} = ethos.useWallet();

  return (
    <Box bg="gray.200" py={4}>
      <Flex maxW="container.lg" mx="auto" align="center" justify="space-between">
        <Box flex={2}>
          <Link as={NextLink} href="/" fontSize="2xl" fontWeight="bold" marginLeft="2rem">
            Home
          </Link>
        </Box>
        <Box flex={2}>
          <Link as={NextLink} href="/mint" fontSize="2xl" fontWeight="bold" marginLeft="2rem">
            Get Cards
          </Link>
        </Box>
        <Box flex={1} textAlign="right" marginRight="2rem">
        {status === EthosConnectStatus.Loading ? (
        <div>Loading...</div>
      ) : status === EthosConnectStatus.NoConnection ? (
        <div>
          <SignInButton />
        </div>
      ) : (
        // status is EthosConnectStatus.Connected
        <button onClick={wallet?.disconnect}>Sign Out</button>
      )}
        </Box>
      </Flex>
    </Box>
  );
}