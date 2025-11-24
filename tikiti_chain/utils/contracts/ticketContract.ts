import {
  createPublicClient as viemCreatePublicClient,
  createWalletClient as viemCreateWalletClient,
  http,
  parseEther,
  formatEther,
  type Address,
  type WalletClient,
  type PublicClient
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACTS, CHAIN_CONFIG, TEST_ACCOUNTS, ACTIVE_NETWORK, getActiveChainConfig } from './config';

// Create public client for reading contract data (uses active network)
export const createPublicClientForActiveNetwork = () => {
  const chainConfig = getActiveChainConfig();
  const rpcUrl = chainConfig.rpcUrls.default.http[0];

  console.log('Creating public client for network:', chainConfig.name);
  console.log('RPC URL:', rpcUrl);
  console.log('Chain ID:', chainConfig.id);

  if (!rpcUrl) {
    throw new Error('No RPC URL configured for active network');
  }

  return viemCreatePublicClient({
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
};

// Create wallet client for writing to contract (uses active network)
export const createWalletClientForActiveNetwork = (privateKey: `0x${string}`) => {
  const account = privateKeyToAccount(privateKey);
  const chainConfig = getActiveChainConfig();
  const rpcUrl = chainConfig.rpcUrls.default.http[0];

  console.log('Creating wallet client for network:', chainConfig.name);
  console.log('RPC URL:', rpcUrl);
  console.log('Chain ID:', chainConfig.id);
  console.log('Account address:', account.address);

  if (!rpcUrl) {
    throw new Error('No RPC URL configured for active network');
  }

  return viemCreateWalletClient({
    account,
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
};

// Legacy functions for backwards compatibility (use active network)
export const createLocalPublicClient = createPublicClientForActiveNetwork;
export const createLocalWalletClient = createWalletClientForActiveNetwork;

// Get default test account for development
export const getDefaultTestAccount = () => {
  return TEST_ACCOUNTS[0];
};

/**
 * Contract Read Functions
 */

// Get event details
export const getEvent = async (eventId: string, publicClient?: PublicClient) => {
  const client = publicClient || createLocalPublicClient();

  const event = await client.readContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'getEvent',
    args: [eventId],
  });

  return event;
};

// Get ticket details
export const getTicket = async (tokenId: bigint, publicClient?: PublicClient) => {
  const client = publicClient || createLocalPublicClient();

  const ticket = await client.readContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'getTicket',
    args: [tokenId],
  });

  return ticket;
};

// Get user's tickets for an event
export const getUserEventTickets = async (
  userAddress: Address,
  eventId: string,
  publicClient?: PublicClient
) => {
  const client = publicClient || createLocalPublicClient();

  const tickets = await client.readContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'getUserEventTickets',
    args: [userAddress, eventId],
  });

  return tickets;
};

// Get token URI
export const getTokenURI = async (tokenId: bigint, publicClient?: PublicClient) => {
  const client = publicClient || createLocalPublicClient();

  const uri = await client.readContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  return uri;
};

// Get token owner
export const getTokenOwner = async (tokenId: bigint, publicClient?: PublicClient) => {
  const client = publicClient || createLocalPublicClient();

  const owner = await client.readContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'ownerOf',
    args: [tokenId],
  });

  return owner;
};

/**
 * Contract Write Functions
 */

// Create a new event
export const createEvent = async (
  params: {
    eventId: string;
    price: bigint;
    totalSupply: bigint;
    royaltyPercent: bigint;
    maxResalePrice: bigint;
    resaleAllowed: boolean;
    eventDate: bigint;
  },
  walletClient: WalletClient
) => {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'createEvent',
    args: [
      params.eventId,
      params.price,
      params.totalSupply,
      params.royaltyPercent,
      params.maxResalePrice,
      params.resaleAllowed,
      params.eventDate,
    ],
  });

  return hash;
};

// Mint a ticket
export const mintTicket = async (
  params: {
    eventId: string;
    tokenURI: string;
    price: bigint;
  },
  walletClient: WalletClient
) => {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'mintTicket',
    args: [params.eventId, params.tokenURI],
    value: params.price,
  });

  return hash;
};

// Redeem a ticket
export const redeemTicket = async (
  tokenId: bigint,
  walletClient: WalletClient
) => {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'redeemTicket',
    args: [tokenId],
  });

  return hash;
};

// Transfer ticket (resale)
export const transferTicket = async (
  params: {
    tokenId: bigint;
    to: Address;
    price: bigint;
  },
  walletClient: WalletClient
) => {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'transferTicket',
    args: [params.tokenId, params.to, params.price],
    value: params.price,
  });

  return hash;
};

// Deactivate event
export const deactivateEvent = async (
  eventId: string,
  walletClient: WalletClient
) => {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.TikitiChainTicket.address,
    abi: CONTRACTS.TikitiChainTicket.abi,
    functionName: 'deactivateEvent',
    args: [eventId],
  });

  return hash;
};

/**
 * Helper functions
 */

// Wait for transaction receipt
export const waitForTransaction = async (
  hash: `0x${string}`,
  publicClient?: PublicClient
) => {
  const client = publicClient || createLocalPublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });
  return receipt;
};

// Parse ETH to wei
export const toWei = (eth: string) => parseEther(eth);

// Format wei to ETH
export const fromWei = (wei: bigint) => formatEther(wei);
