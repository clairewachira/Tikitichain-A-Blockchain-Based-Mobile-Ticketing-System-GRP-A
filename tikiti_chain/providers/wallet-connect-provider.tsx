import React, { ReactNode } from "react";
import "@walletconnect/react-native-compat";
import { WalletConnectModal } from "@walletconnect/modal-react-native";
import Constants from "expo-constants";
import { ACTIVE_NETWORK, NETWORKS } from "@/utils/contracts/config";

const projectId =
  Constants.expoConfig?.extra?.walletConnectProjectId ||
  process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
  "";

const providerMetadata = {
  name: "Tikiti Chain",
  description: "NFT Event Ticketing Platform",
  url: "https://tikiti-chain.com",
  icons: ["https://tikiti-chain.com/icon.png"],
  redirect: {
    native: "tikiti-chain://",
    universal: "https://tikiti-chain.com",
  },
};

// Configure supported chains based on active network
const getSupportedChains = () => {
  if (ACTIVE_NETWORK === NETWORKS.AMOY) {
    return ["eip155:80002"]; // Polygon Amoy Testnet
  } else if (ACTIVE_NETWORK === NETWORKS.LOCAL) {
    return ["eip155:1337"]; // Local network
  } else {
    return ["eip155:137"]; // Polygon Mainnet
  }
};

interface WalletConnectProviderProps {
  children: ReactNode;
}

export default function WalletConnectProvider({
  children,
}: WalletConnectProviderProps) {
  if (!projectId) {
    console.warn(
      "WalletConnect Project ID not found. Please add EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env file",
    );
  }

  return (
    <>
      {children}
      <WalletConnectModal
        projectId={projectId}
        providerMetadata={providerMetadata}
        sessionParams={{
          namespaces: {
            eip155: {
              methods: [
                "eth_sendTransaction",
                "eth_signTransaction",
                "eth_sign",
                "personal_sign",
                "eth_signTypedData",
              ],
              chains: getSupportedChains(),
              events: ["chainChanged", "accountsChanged"],
              rpcMap: {
                80002: "https://rpc-amoy.polygon.technology/",
                137: "https://polygon-rpc.com/",
                1337: "http://127.0.0.1:8545",
              },
            },
          },
        }}
      />
    </>
  );
}
