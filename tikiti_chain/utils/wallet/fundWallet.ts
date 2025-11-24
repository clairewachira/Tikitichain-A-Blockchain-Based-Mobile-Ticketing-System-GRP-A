import { createPublicClient, createWalletClient, http, parseEther, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TEST_ACCOUNTS, CHAIN_CONFIG, ACTIVE_NETWORK, NETWORKS, getActiveChainConfig } from '@/utils/contracts/config';

/**
 * Fund a wallet with ETH/MATIC from test account
 * For LOCAL: Uses Hardhat test account
 * For AMOY: Requires manual funding from faucet (this function will skip)
 */
export async function fundWalletFromTestAccount(
  recipientAddress: Address,
  amountInEth: string = '10' // Default to 10 ETH
): Promise<`0x${string}`> {
  try {
    // Only fund on local network
    if (ACTIVE_NETWORK !== NETWORKS.LOCAL) {
      console.log('Auto-funding only available on local network. Please use faucet for testnet/mainnet.');
      throw new Error('Auto-funding not available on this network. Please use a faucet.');
    }

    // Use the first Hardhat test account (has 10000 ETH by default)
    const funderAccount = privateKeyToAccount(TEST_ACCOUNTS[0].privateKey);
    const chainConfig = getActiveChainConfig();
    const rpcUrl = chainConfig.rpcUrls.default.http[0];

    // Create wallet client with funder account
    const walletClient = createWalletClient({
      account: funderAccount,
      chain: {
        id: chainConfig.id,
        name: chainConfig.name,
        nativeCurrency: chainConfig.nativeCurrency,
        rpcUrls: chainConfig.rpcUrls,
        testnet: chainConfig.testnet,
      } as any,
      transport: http(rpcUrl),
    });

    // Send ETH to recipient
    const hash = await walletClient.sendTransaction({
      to: recipientAddress,
      value: parseEther(amountInEth),
    });

    console.log(`Funded ${recipientAddress} with ${amountInEth} ETH`);
    console.log(`Transaction hash: ${hash}`);

    return hash;
  } catch (error) {
    console.error('Error funding wallet:', error);
    throw error;
  }
}

/**
 * Check wallet balance
 */
export async function checkWalletBalance(
  address: Address
): Promise<{ balance: bigint; balanceInEth: string }> {
  const chainConfig = getActiveChainConfig();
  const rpcUrl = chainConfig.rpcUrls.default.http[0];

  const publicClient = createPublicClient({
    chain: {
      id: chainConfig.id,
      name: chainConfig.name,
      nativeCurrency: chainConfig.nativeCurrency,
      rpcUrls: chainConfig.rpcUrls,
      blockExplorers: chainConfig.blockExplorers,
      testnet: chainConfig.testnet,
    } as any,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address });
  const balanceInEth = (Number(balance) / 1e18).toFixed(4);

  return { balance, balanceInEth };
}
