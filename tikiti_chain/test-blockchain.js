#!/usr/bin/env node

/**
 * Quick test script to verify blockchain setup and contract deployment
 * Run with: node test-blockchain.js
 */

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');

// Load contract ABI
const contractAbi = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'utils/contracts/TikitiChainTicket.abi.json'),
    'utf8'
  )
);

// Configuration
const CHAIN_CONFIG = {
  id: 1337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
};

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const TEST_ACCOUNT = {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
};

// Create clients
const publicClient = createPublicClient({
  chain: CHAIN_CONFIG,
  transport: http(),
});

const account = privateKeyToAccount(TEST_ACCOUNT.privateKey);
const walletClient = createWalletClient({
  account,
  chain: CHAIN_CONFIG,
  transport: http(),
});

async function main() {
  console.log('🚀 Testing Tikiti Chain Blockchain Setup\n');

  try {
    // 1. Check network connection
    console.log('1️⃣  Checking network connection...');
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`   ✅ Connected to local network (Block #${blockNumber})\n`);

    // 2. Check account balance
    console.log('2️⃣  Checking test account balance...');
    const balance = await publicClient.getBalance({ address: TEST_ACCOUNT.address });
    console.log(`   ✅ Account: ${TEST_ACCOUNT.address}`);
    console.log(`   ✅ Balance: ${formatEther(balance)} ETH\n`);

    // 3. Verify contract deployment
    console.log('3️⃣  Verifying contract deployment...');
    const bytecode = await publicClient.getBytecode({ address: CONTRACT_ADDRESS });
    if (!bytecode || bytecode === '0x') {
      throw new Error('Contract not deployed! Run: cd contracts && npm run deploy:local');
    }
    console.log(`   ✅ Contract deployed at: ${CONTRACT_ADDRESS}\n`);

    // 4. Create a test event
    console.log('4️⃣  Creating test event...');
    const eventId = `test-event-${Date.now()}`;
    const eventDate = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now

    const { request } = await publicClient.simulateContract({
      account,
      address: CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'createEvent',
      args: [
        eventId,
        parseEther('0.01'), // price
        BigInt(100), // totalSupply
        BigInt(500), // royaltyPercent (5%)
        parseEther('0.05'), // maxResalePrice
        true, // resaleAllowed
        BigInt(eventDate), // eventDate
      ],
    });

    const hash = await walletClient.writeContract(request);
    console.log(`   ⏳ Transaction hash: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ Event created! (Gas used: ${receipt.gasUsed})\n`);

    // 5. Read event data
    console.log('5️⃣  Reading event data...');
    const event = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'getEvent',
      args: [eventId],
    });

    console.log(`   ✅ Event ID: ${event[0]}`);
    console.log(`   ✅ Organizer: ${event[1]}`);
    console.log(`   ✅ Price: ${formatEther(event[2])} ETH`);
    console.log(`   ✅ Total Supply: ${event[3]}`);
    console.log(`   ✅ Sold: ${event[4]}`);
    console.log(`   ✅ Active: ${event[8]}\n`);

    // 6. Mint a ticket
    console.log('6️⃣  Minting a ticket...');
    const mintRequest = await publicClient.simulateContract({
      account,
      address: CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'mintTicket',
      args: [eventId, `ipfs://test-ticket-${Date.now()}`],
      value: parseEther('0.01'),
    });

    const mintHash = await walletClient.writeContract(mintRequest.request);
    console.log(`   ⏳ Transaction hash: ${mintHash}`);

    const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
    console.log(`   ✅ Ticket minted! (Gas used: ${mintReceipt.gasUsed})\n`);

    // 7. Check user tickets
    console.log('7️⃣  Checking user tickets...');
    const userTickets = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: contractAbi,
      functionName: 'getUserEventTickets',
      args: [TEST_ACCOUNT.address, eventId],
    });

    console.log(`   ✅ User owns ${userTickets.length} ticket(s)`);
    if (userTickets.length > 0) {
      console.log(`   ✅ Token IDs: ${userTickets.join(', ')}\n`);
    }

    // 8. Final balance check
    console.log('8️⃣  Checking final balance...');
    const finalBalance = await publicClient.getBalance({ address: TEST_ACCOUNT.address });
    const spent = balance - finalBalance;
    console.log(`   ✅ Final Balance: ${formatEther(finalBalance)} ETH`);
    console.log(`   ✅ Total Spent: ${formatEther(spent)} ETH\n`);

    console.log('✨ All tests passed! Blockchain setup is working correctly.\n');
    console.log('📱 Next steps:');
    console.log('   1. Run: bun start');
    console.log('   2. Open the app and go to the Wallet tab');
    console.log('   3. Try creating events and minting tickets!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure Hardhat node is running: cd contracts && npm run node');
    console.error('   2. Deploy the contract: cd contracts && npm run deploy:local');
    console.error('   3. Check that the contract address is correct in utils/contracts/config.ts\n');
    process.exit(1);
  }
}

main();
