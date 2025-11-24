import TikitiChainTicketAbi from "./TikitiChainTicket.abi.json";

// Network identifiers
export const NETWORKS = {
  LOCAL: "local",
  AMOY: "amoy",
  POLYGON: "polygon",
} as const;

// Set active network - CHANGE THIS TO SWITCH NETWORKS
export const ACTIVE_NETWORK = NETWORKS.AMOY; // Change to NETWORKS.AMOY for testnet

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  [NETWORKS.LOCAL]:
    "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,
  [NETWORKS.AMOY]:
    "0x0428Aeed0ffa5E7Ba631E1b02e85C42e0B7A0510" as `0x${string}`, // Update after deployment
  [NETWORKS.POLYGON]:
    "0x0000000000000000000000000000000000000000" as `0x${string}`, // Update after deployment
} as const;

export const CONTRACTS = {
  TikitiChainTicket: {
    address: CONTRACT_ADDRESSES[ACTIVE_NETWORK],
    abi: TikitiChainTicketAbi,
  },
} as const;

// Chain configurations (compatible with viem)
export const CHAIN_CONFIG = {
  // Local Hardhat network
  [NETWORKS.LOCAL]: {
    id: 1337,
    name: "Hardhat Local",
    network: "localhost",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        // Use 10.0.2.2 for Android emulator, 127.0.0.1 for iOS simulator
        http: ["http://10.0.2.2:8545"],
      },
      public: {
        http: ["http://127.0.0.1:8545"],
      },
    },
    testnet: true,
  },

  // Polygon Amoy testnet (Mumbai replacement)
  [NETWORKS.AMOY]: {
    id: 80002,
    name: "Polygon Amoy",
    nativeCurrency: {
      decimals: 18,
      name: "MATIC",
      symbol: "MATIC",
    },
    rpcUrls: {
      default: {
        http: ["https://rpc-amoy.polygon.technology"],
      },
      public: {
        http: ["https://rpc-amoy.polygon.technology"],
      },
    },
    blockExplorers: {
      default: {
        name: "PolygonScan",
        url: "https://amoy.polygonscan.com",
      },
    },
    testnet: true,
  },

  // Polygon mainnet
  [NETWORKS.POLYGON]: {
    id: 137,
    name: "Polygon",
    nativeCurrency: {
      decimals: 18,
      name: "MATIC",
      symbol: "MATIC",
    },
    rpcUrls: {
      default: {
        http: ["https://polygon-rpc.com"],
      },
      public: {
        http: ["https://polygon-rpc.com"],
      },
    },
    blockExplorers: {
      default: {
        name: "PolygonScan",
        url: "https://polygonscan.com",
      },
    },
    testnet: false,
  },
} as const;

// Get active chain configuration
export const getActiveChainConfig = () => CHAIN_CONFIG[ACTIVE_NETWORK];
export const getActiveContractAddress = () =>
  CONTRACT_ADDRESSES[ACTIVE_NETWORK];

// Test accounts from Hardhat (these are publicly known test accounts - DO NOT use on mainnet!)
export const TEST_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
] as const;
