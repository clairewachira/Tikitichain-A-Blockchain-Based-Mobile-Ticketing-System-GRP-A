# TikitiChain Smart Contracts

NFT-based ticketing system smart contracts for the TikitiChain platform.

## 🎯 Quick Start

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npm run compile
```

### Run Demo Tests (FREE - No testnet needed!)
```bash
npm run test:demo
```

This will run a comprehensive test that demonstrates:
- Creating events
- Minting NFT tickets
- Transferring tickets with royalty payments
- Redeeming tickets
- All ERC721 functionality

## 🚀 Deployment Options

### Option 1: Local Testing (Recommended for Development) ✅

**Best for:** Free, fast development and testing

```bash
# Run a comprehensive demo test
npm run test:demo

# Start a persistent local blockchain
npm run node

# In another terminal, deploy to the local node
npm run deploy:local
```

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for detailed instructions.

### Option 2: Polygon Amoy Testnet

**Best for:** Testing on a real network before mainnet

Requirements:
- Test MATIC from faucet: https://faucet.polygon.technology/
- Fund address: Check your `.env` PRIVATE_KEY

```bash
npm run deploy:amoy
```

### Option 3: Polygon Mainnet

**Best for:** Production deployment

⚠️ **Warning:** This costs real money! Only deploy after thorough testing.

```bash
npm run deploy:polygon
```

## 📁 Contract Structure

### TikitiChainTicket.sol

Main NFT ticketing contract implementing:

- **ERC721** standard for NFT tickets
- **Event Management** - Create and manage events
- **Ticket Minting** - Issue NFT tickets for events
- **Resale Control** - Optional resale with max price limits
- **Royalty System** - Automatic royalty payments to organizers
- **Ticket Redemption** - Mark tickets as used at event entry
- **Metadata Storage** - IPFS URI support for ticket metadata

### Key Features

#### Event Creation
```solidity
function createEvent(
    string memory _eventId,
    uint256 _price,
    uint256 _totalSupply,
    uint256 _royaltyPercent,
    uint256 _maxResalePrice,
    bool _resaleAllowed,
    uint256 _eventDate
) external
```

#### Ticket Minting
```solidity
function mintTicket(
    string memory _eventId,
    string memory _tokenURI
) external payable
```

#### Ticket Transfer/Resale
```solidity
function transferTicket(
    uint256 _tokenId,
    address _to,
    uint256 _price
) external payable
```

#### Ticket Redemption
```solidity
function redeemTicket(uint256 _tokenId) external
```

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm run test` | Run contract tests |
| `npm run test:demo` | Run comprehensive demo test |
| `npm run node` | Start local Hardhat blockchain |
| `npm run deploy:local` | Deploy to local Hardhat network |
| `npm run deploy:amoy` | Deploy to Polygon Amoy testnet |
| `npm run deploy:polygon` | Deploy to Polygon mainnet |
| `npm run balance` | Check account balances on local node |

## 🔑 Environment Variables

Create a `.env` file (or use parent directory's `.env`):

```bash
# Required for deployment
PRIVATE_KEY=0x...your-private-key...

# RPC URLs (optional, defaults provided)
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com

# For contract verification (optional)
POLYGONSCAN_API_KEY=your-api-key
```

⚠️ **Never commit your private key!** Use test keys for development.

## 📦 Deployment Artifacts

After deployment, contract info is saved to:
```
contracts/deployments/{network}.json
```

Example:
```json
{
  "network": "amoy",
  "chainId": 80002,
  "contractAddress": "0x...",
  "deployedAt": "2024-11-04T10:00:00.000Z",
  "contractName": "TikitiChainTicket"
}
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Demo Test with Output
```bash
npm run test:demo
```

The demo test covers:
- ✅ Event creation
- ✅ Ticket minting (2 tickets)
- ✅ Metadata assignment
- ✅ Ticket resale with royalty calculation
- ✅ Ownership verification
- ✅ ERC721 interface compliance

## 🏗️ Tech Stack

- **Solidity** ^0.8.20
- **Hardhat** - Development environment
- **OpenZeppelin** v4.9 - Secure contract standards
- **Ethers.js** v6 - Ethereum library
- **Dotenv** - Environment configuration

## 📚 Contract Details

### Inheritance
```
TikitiChainTicket
  ├─ ERC721
  ├─ ERC721URIStorage
  ├─ ERC721Burnable
  ├─ Ownable
  └─ ReentrancyGuard
```

### Gas Optimization
- Optimizer enabled (200 runs)
- Efficient storage packing
- Minimal external calls

### Security Features
- ReentrancyGuard on critical functions
- Input validation on all functions
- Ownership controls
- Safe math operations (Solidity 0.8+)

## 🌐 Network Information

### Local Hardhat
- **Chain ID:** 1337
- **RPC:** http://localhost:8545
- **Currency:** ETH
- **Accounts:** 20 pre-funded (10,000 ETH each)

### Polygon Amoy Testnet
- **Chain ID:** 80002
- **RPC:** https://rpc-amoy.polygon.technology
- **Currency:** MATIC
- **Faucet:** https://faucet.polygon.technology/
- **Explorer:** https://amoy.polygonscan.com/

### Polygon Mainnet
- **Chain ID:** 137
- **RPC:** https://polygon-rpc.com
- **Currency:** MATIC
- **Explorer:** https://polygonscan.com/

## 🔐 Security Considerations

### Development
- ✅ Use test private keys locally
- ✅ Never commit private keys
- ✅ Test thoroughly before mainnet
- ✅ Run security audits for production

### Deployment
- ⚠️ Verify contract source on explorer
- ⚠️ Test all functions on testnet first
- ⚠️ Use hardware wallet for mainnet
- ⚠️ Set appropriate access controls

## 📖 Further Reading

- [LOCAL_TESTING.md](./LOCAL_TESTING.md) - Detailed local testing guide
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)

## 🤝 Contributing

1. Test your changes locally first
2. Run all tests: `npm test`
3. Ensure compilation succeeds: `npm run compile`
4. Follow Solidity style guide

## 📄 License

MIT
