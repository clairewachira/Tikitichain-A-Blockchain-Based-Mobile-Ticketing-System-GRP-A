import { useMutation } from "@tanstack/react-query";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import { getUserWalletAddress } from "@/utils/wallet/walletManager";
import { ACTIVE_NETWORK, NETWORKS } from "@/utils/contracts/config";
import { Toast } from "toastify-react-native";
import { Linking } from "react-native";

/**
 * Hook to request testnet MATIC from faucet
 */
export function useRequestTestnetFunds() {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not authenticated");

      const walletAddress = await getUserWalletAddress(userId);
      if (!walletAddress) throw new Error("No wallet found");

      // Check network
      if (ACTIVE_NETWORK === NETWORKS.LOCAL) {
        throw new Error("Local network doesn't need faucet - auto-funded!");
      }

      if (ACTIVE_NETWORK === NETWORKS.AMOY) {
        // Open Polygon Amoy faucet
        const faucetUrl = `https://faucet.polygon.technology/`;
        const canOpen = await Linking.canOpenURL(faucetUrl);

        if (canOpen) {
          await Linking.openURL(faucetUrl);
          return {
            success: true,
            message: "Opening Polygon faucet. Please connect your wallet and request MATIC.",
            walletAddress,
          };
        } else {
          throw new Error("Cannot open faucet URL");
        }
      }

      throw new Error("Faucet not configured for this network");
    },
    onSuccess: (data) => {
      Toast.success("Faucet opened! Request MATIC for your wallet.");
    },
    onError: (error: any) => {
      Toast.error(error.message || "Failed to open faucet");
    },
  });
}

/**
 * Get faucet info for current network
 */
export function getFaucetInfo(): {
  available: boolean;
  url?: string;
  instructions?: string;
} {
  if (ACTIVE_NETWORK === NETWORKS.LOCAL) {
    return {
      available: false,
      instructions: "Local network wallets are auto-funded!",
    };
  }

  if (ACTIVE_NETWORK === NETWORKS.AMOY) {
    return {
      available: true,
      url: "https://faucet.polygon.technology/",
      instructions:
        "Get free testnet MATIC from Polygon faucet. You'll need to connect your wallet.",
    };
  }

  return {
    available: false,
    instructions: "Please purchase MATIC from an exchange.",
  };
}
