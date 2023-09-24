import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { EthosConnectProvider, Chain } from "ethos-connect";
import { ChakraProvider } from "@chakra-ui/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <EthosConnectProvider
        ethosConfiguration={{
          chain: Chain.SUI_DEVNET,
          network: "https://fullnode.devnet.sui.io/",
        }}
      >
        <Component {...pageProps} />
      </EthosConnectProvider>
    </ChakraProvider>
  );
}
