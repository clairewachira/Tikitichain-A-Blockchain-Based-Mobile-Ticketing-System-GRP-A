# Local Blockchain Testing Guide

This guide shows you how to test the TikitiChain smart contracts locally for **FREE** using Hardhat's built-in blockchain.

## ✅ Quick Test (Already Done!)

We've successfully tested the contract with the test script:

```bash
npx hardhat run test-contract.js --network hardhat
```

**All tests passed! ✨**
- Event creation ✅
- Ticket minting ✅
- Ticket metadata (IPFS URIs) ✅
- Ticket resale with royalties ✅
- Owner verification ✅
- ERC721 compliance ✅

## 🚀 Running a Persistent Local Node

For integrating with your React Native app, you need a **persistent** local blockchain that stays running:

### Step 1: Start the Hardhat Node

In the `contracts` directory, run:

```bash
npm run node
```

This will:
- Start a local blockchain at `http://localhost:8545`
- Create 20 test accounts with 10,000 ETH each
- Show you the private keys and addresses
- Keep running until you stop it (Ctrl+C)

**Example output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...
```

### Step 2: Deploy to the Persistent Node

**In a new terminal window** (keep the node running), run:

```bash
cd contracts
npm run deploy:local
```

This will deploy the contract and save the address to `contracts/deployments/hardhat.json`.

**Example output:**
```
TikitiChainTicket deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Network: hardhat
Chain ID: 1337
```

### Step 3: Update Your React Native App

Update your `.env` file with the local contract address:

```bash
EXPO_PUBLIC_CONTRACT_ADDRESS_HARDHAT=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 4: Connect MetaMask (Optional)

If you want to test with MetaMask:

1. Open MetaMask
2. Add a custom network:
   - **Network Name:** Hardhat Local
   - **RPC URL:** http://localhost:8545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH

3. Import one of the test accounts using its private key (from Step 1)

4. You'll have 10,000 test ETH to play with!

## 📱 Testing with Your React Native App

### Configure Your App

1. **Update blockchain config** (`utils/blockchain/config.ts`):
```typescript
export const NETWORKS = {
  hardhat: {
    name: "Hardhat Local",
    rpcUrl: "http://localhost:8545",  // Use your computer's IP if testing on device
    chainId: 1337,
    currency: "ETH",
    blockExplorer: null,
  },
  // ... other networks
};
```

2. **Use the local network** in your app's network selector

3. **Import a test account** in your wallet (use private key from Step 1)

### Testing on a Physical Device

If testing on a physical device (not emulator), replace `localhost` with your computer's local IP:

```typescript
rpcUrl: "http://192.168.1.XXX:8545"  // Replace XXX with your IP
```

To find your local IP:
- **Mac:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** `ipconfig` and look for IPv4
- **Linux:** `ip addr show`

## 🎯 Test Scenarios

Here are some scenarios to test in your app:

### 1. Create an Event
```javascript
const tx = await contract.createEvent(
  "my-event-123",
  ethers.parseEther("0.1"),  // 0.1 ETH ticket price
  100,                        // 100 tickets
  500,                        // 5% royalty
  ethers.parseEther("0.15"),  // Max resale price
  true,                       // Allow resale
  Math.floor(Date.now() / 1000) + 86400  // Tomorrow
);
await tx.wait();
```

### 2. Mint a Ticket
```javascript
const tx = await contract.mintTicket(
  "my-event-123",
  "ipfs://QmYourMetadata/1.json",
  { value: ethers.parseEther("0.1") }
);
await tx.wait();
```

### 3. Resell a Ticket
```javascript
const tx = await contract.transferTicket(
  0,  // Token ID
  buyerAddress,
  ethers.parseEther("0.12"),  // Resale price
  { value: ethers.parseEther("0.12") }
);
await tx.wait();
```

### 4. Redeem a Ticket
```javascript
const tx = await contract.redeemTicket(0);  // Token ID
await tx.wait();
```

## 🔧 Useful Commands

### View Account Balances
```bash
npx hardhat run --network localhost scripts/check-balance.js
```

### Reset the Blockchain
Stop the node (Ctrl+C) and restart it:
```bash
npm run node
```

All transactions and state will be reset.

### Run Tests
```bash
npx hardhat test
npm run test
```

### Compile Contracts
```bash
npm run compile
```

## 📝 Test Account Private Keys

These are Hardhat's default test accounts (safe to use locally):

```
Account #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Account #1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Account #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

⚠️ **Never use these on real networks!** They are publicly known.

## 🎨 Benefits of Local Testing

✅ **Free** - No gas costs, no testnet tokens needed
✅ **Fast** - Instant block times, no waiting
✅ **Unlimited funds** - 10,000 ETH per account
✅ **Reset anytime** - Start fresh whenever you want
✅ **No network delays** - Everything runs on your machine
✅ **Privacy** - No public blockchain exposure during development

## 🚨 Common Issues

### Port already in use
```bash
# Kill the process using port 8545
lsof -ti:8545 | xargs kill
```

### Can't connect from React Native
- Use your computer's IP instead of `localhost`
- Make sure your device is on the same network
- Check firewall settings

### Contract not found
- Make sure you deployed after starting the node
- Check the contract address in your .env file
- Verify the network is set to "hardhat" or "localhost"

## 📦 Next Steps

Once you've tested locally and everything works:

1. Get test MATIC for Polygon Amoy testnet
2. Deploy to Amoy: `npm run deploy:amoy`
3. Update your `.env` with the Amoy contract address
4. Test on a real testnet before mainnet

## 🎯 Test Checklist

- [ ] Start Hardhat node
- [ ] Deploy contract
- [ ] Create an event
- [ ] Mint tickets
- [ ] Transfer/resell tickets
- [ ] Check royalty payments
- [ ] Redeem tickets
- [ ] Test with React Native app
- [ ] Test on physical device
- [ ] Test with MetaMask

Happy testing! 🎉
