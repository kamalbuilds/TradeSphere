import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import type { AppProps } from "next/app";
import Header from "../components/Header/Header";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import AccountAbstractionProvider from "../contexts/AccountAbstractionContext";
import TransactionProvider from "../contexts/TransactionContext";

export default function App({ Component, pageProps }: AppProps) {
  // Initialize React Query Client
  const queryClient = new QueryClient();

  // Specify what network yf651e183e87484fb9a0e4743b2b71bebou're going to interact with
  const activeChain = "mumbai";

  return (
    // For thirdweb functionality
    <ChakraProvider>
      <AccountAbstractionProvider>
        <TransactionProvider>
          <ThirdwebProvider
            activeChain={activeChain}
            clientId="8fafa242d0c865b0c3caa9242d9a2258">

            {/* For React Query functionality */}
            <QueryClientProvider client={queryClient}>
              {/* For React Query supporting SSR */}
              <Hydrate state={pageProps.dehydratedState}>
                <Header />
                <Component {...pageProps} />
              </Hydrate>
            </QueryClientProvider>
          </ThirdwebProvider>
        </TransactionProvider>
      </AccountAbstractionProvider>
    </ChakraProvider>
  );
}
