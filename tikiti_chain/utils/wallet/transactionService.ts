import { createWalletClientForActiveNetwork } from "@/utils/contracts/ticketContract";
import { getUserWalletInfo, getUserPrivateKey } from "@/utils/wallet/walletManager";
import type { Address, WalletClient } from "viem";

/**
 * Get wallet client for transaction signing
 * Handles both custodial and WalletConnect wallets
 */
export async function getWalletClientForUser(
  userId: string,
  walletConnectProvider?: any
): Promise<{ walletClient: WalletClient | null; walletType: "custodial" | "walletconnect" }> {
  const walletInfo = await getUserWalletInfo(userId);

  if (!walletInfo) {
    throw new Error("User has no wallet configured");
  }

  if (walletInfo.walletType === "custodial") {
    // Get private key for custodial wallet
    const privateKey = await getUserPrivateKey(userId);
    if (!privateKey) {
      throw new Error("Failed to retrieve wallet private key");
    }

    // Create viem wallet client for custodial wallet
    const walletClient = createWalletClientForActiveNetwork(privateKey);
    return { walletClient, walletType: "custodial" };
  } else {
    // For WalletConnect, we don't create a viem wallet client
    // Instead, transactions will be sent through the WalletConnect provider
    return { walletClient: null, walletType: "walletconnect" };
  }
}

/**
 * Sign and send a transaction
 * Works with both custodial and WalletConnect wallets
 */
export async function signAndSendTransaction(
  userId: string,
  transaction: {
    to: Address;
    data?: `0x${string}`;
    value?: bigint;
    gas?: bigint;
  },
  walletConnectProvider?: any
): Promise<`0x${string}`> {
  const { walletClient, walletType } = await getWalletClientForUser(
    userId,
    walletConnectProvider
  );

  if (walletType === "custodial" && walletClient) {
    // Use viem wallet client for custodial wallets
    const hash = await walletClient.sendTransaction({
      to: transaction.to,
      data: transaction.data,
      value: transaction.value,
      gas: transaction.gas,
    });

    return hash;
  } else if (walletType === "walletconnect" && walletConnectProvider) {
    // Use WalletConnect provider for external wallets
    const hash = await walletConnectProvider.request({
      method: "eth_sendTransaction",
      params: [
        {
          to: transaction.to,
          data: transaction.data || "0x",
          value: transaction.value ? `0x${transaction.value.toString(16)}` : "0x0",
          gas: transaction.gas ? `0x${transaction.gas.toString(16)}` : undefined,
        },
      ],
    });

    return hash as `0x${string}`;
  } else {
    throw new Error(
      "WalletConnect provider required for external wallet transactions"
    );
  }
}

/**
 * Write contract function with both wallet types support
 */
export async function writeContract(
  userId: string,
  contractAddress: Address,
  abi: any[],
  functionName: string,
  args: any[],
  value?: bigint,
  walletConnectProvider?: any
): Promise<`0x${string}`> {
  const { walletClient, walletType } = await getWalletClientForUser(
    userId,
    walletConnectProvider
  );

  if (walletType === "custodial" && walletClient) {
    // Use viem's writeContract for custodial wallets
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      value,
    });

    return hash;
  } else if (walletType === "walletconnect" && walletConnectProvider) {
    // For WalletConnect, we need to encode the function call manually
    // This is a simplified version - in production, use viem's encodeFunctionData
    const { encodeFunctionData } = await import("viem");

    const data = encodeFunctionData({
      abi,
      functionName,
      args,
    });

    const hash = await walletConnectProvider.request({
      method: "eth_sendTransaction",
      params: [
        {
          to: contractAddress,
          data,
          value: value ? `0x${value.toString(16)}` : "0x0",
        },
      ],
    });

    return hash as `0x${string}`;
  } else {
    throw new Error(
      "WalletConnect provider required for external wallet transactions"
    );
  }
}
