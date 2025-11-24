import { useWalletConnectModal } from "@walletconnect/modal-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import { supabase } from "@/utils/supabase";
import { ACTIVE_NETWORK, NETWORKS } from "@/utils/contracts/config";

/**
 * Hook to manage WalletConnect integration
 */
export function useWalletConnect() {
  const { open, isConnected, address, provider } = useWalletConnectModal();
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  /**
   * Connect external wallet via WalletConnect
   */
  const connectWallet = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not authenticated");

      try {
        // Open WalletConnect modal
        await open();

        // Wait for connection (address will be available after connection)
        // The modal hook will update the address state automatically
        return { success: true };
      } catch (error: any) {
        console.error("WalletConnect connection error:", error);
        throw new Error(error.message || "Failed to connect wallet");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
    },
  });

  /**
   * Save connected wallet address to database
   */
  const saveWalletAddress = useMutation({
    mutationFn: async (walletAddress: string) => {
      if (!userId) throw new Error("User not authenticated");

      // Check if user already has a WalletConnect wallet
      const { data: existingWallet } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("wallet_type", "walletconnect")
        .maybeSingle();

      if (existingWallet) {
        // Update existing wallet
        const { error } = await supabase
          .from("user_wallets")
          .update({
            wallet_address: walletAddress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingWallet.id);

        if (error) throw error;
      } else {
        // Create new WalletConnect wallet entry
        const { error } = await supabase.from("user_wallets").insert({
          user_id: userId,
          wallet_address: walletAddress,
          wallet_type: "walletconnect",
          encrypted_private_key: "", // External wallets don't store private keys (empty string for non-null constraint)
        });

        if (error) throw error;
      }

      return walletAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWallet"] });
    },
  });

  /**
   * Send transaction using WalletConnect provider
   */
  const sendTransaction = async (transaction: {
    to: string;
    value?: string;
    data?: string;
    from?: string;
  }) => {
    if (!provider) throw new Error("WalletConnect provider not available");
    if (!isConnected) throw new Error("Wallet not connected");

    try {
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: transaction.to,
            value: transaction.value || "0x0",
            data: transaction.data || "0x",
          },
        ],
      });

      return txHash;
    } catch (error: any) {
      console.error("Transaction error:", error);
      throw new Error(error.message || "Transaction failed");
    }
  };

  /**
   * Sign message using WalletConnect provider
   */
  const signMessage = async (message: string) => {
    if (!provider) throw new Error("WalletConnect provider not available");
    if (!isConnected) throw new Error("Wallet not connected");

    try {
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });

      return signature;
    } catch (error: any) {
      console.error("Sign message error:", error);
      throw new Error(error.message || "Failed to sign message");
    }
  };

  /**
   * Get current chain ID from provider
   */
  const getCurrentChainId = async (): Promise<string | null> => {
    if (!provider) {
      console.error("Provider not available for chain ID check");
      return null;
    }

    try {
      const chainId = await provider.request({
        method: "eth_chainId",
        params: [],
      });

      if (!chainId) {
        console.error("Chain ID returned undefined/null");
        return null;
      }

      console.log("Current chain ID from wallet:", chainId);
      return String(chainId);
    } catch (error) {
      console.error("Failed to get chain ID:", error);
      return null;
    }
  };

  /**
   * Check if wallet is on correct network
   */
  const checkNetwork = async (): Promise<boolean> => {
    const currentChainId = await getCurrentChainId();

    if (!currentChainId) {
      console.error("Could not determine current chain ID");
      return false;
    }

    const expectedChainId =
      ACTIVE_NETWORK === NETWORKS.AMOY
        ? "0x13882" // Polygon Amoy Testnet (80002 in decimal)
        : ACTIVE_NETWORK === NETWORKS.LOCAL
          ? "0x539" // Local network (1337 in decimal)
          : "0x89"; // Polygon Mainnet (137 in decimal)

    const isCorrect = currentChainId.toLowerCase() === expectedChainId.toLowerCase();
    console.log(
      `Network check: current=${currentChainId}, expected=${expectedChainId}, isCorrect=${isCorrect}`
    );
    return isCorrect;
  };

  /**
   * Switch to correct network (for wallets that support it)
   * Note: Many mobile wallets via WalletConnect don't support programmatic network switching
   */
  const switchNetwork = async () => {
    if (!provider) throw new Error("WalletConnect provider not available");

    // First check if already on correct network
    const isCorrectNetwork = await checkNetwork();
    if (isCorrectNetwork) {
      console.log("Already on correct network");
      return;
    }

    const chainId =
      ACTIVE_NETWORK === NETWORKS.AMOY
        ? "0x13882" // Polygon Amoy Testnet (80002 in decimal)
        : ACTIVE_NETWORK === NETWORKS.LOCAL
          ? "0x539" // Local network (1337 in decimal)
          : "0x89"; // Polygon Mainnet (137 in decimal)

    const networkName =
      ACTIVE_NETWORK === NETWORKS.AMOY
        ? "Polygon Amoy Testnet"
        : ACTIVE_NETWORK === NETWORKS.LOCAL
          ? "Local Network"
          : "Polygon Mainnet";

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (switchError: any) {
      // Most mobile wallets don't support programmatic network switching
      // Provide helpful instructions instead
      console.log("Network switch not supported:", switchError.message);
      throw new Error(
        `Please manually switch to ${networkName} in your wallet app.\n\n` +
          `Network Details:\n` +
          `• Chain ID: ${parseInt(chainId, 16)}\n` +
          `• RPC URL: https://rpc-amoy.polygon.technology/\n` +
          `• Currency: MATIC\n\n` +
          `After switching networks, please try connecting again.`
      );
    }
  };

  return {
    // State
    isConnected,
    address,
    provider,

    // Actions
    connectWallet: connectWallet.mutateAsync,
    saveWalletAddress: saveWalletAddress.mutateAsync,
    sendTransaction,
    signMessage,
    switchNetwork,
    checkNetwork,

    // Loading states
    isConnecting: connectWallet.isPending,
    isSaving: saveWalletAddress.isPending,
  };
}
