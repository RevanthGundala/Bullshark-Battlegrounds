import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { EthosConnectProvider, Chain } from 'ethos-connect';
import { ChakraProvider } from '@chakra-ui/react'

export default function App({ Component, pageProps }: AppProps) {
  return(
    <ChakraProvider>
    <EthosConnectProvider
    ethosConfiguration={{
      // apiKey: [YOUR API KEY] // Optional. Required for email signin. Please contact support@ethoswallet.xyz to acquire an API key.
       // Optional. Defaults to sui:devnet - An enum containing acceptable chain identifier strings can be imported from the ethos-connect package 
      // network: [RPC URL] // Optional. Defaults to https://fullnode.devnet.sui.io/ 
      // hideEmailSignIn: true // Optional.  Defaults to false
    }}
  >
  <Component {...pageProps} />
  </EthosConnectProvider>
  </ChakraProvider>
  );
}
