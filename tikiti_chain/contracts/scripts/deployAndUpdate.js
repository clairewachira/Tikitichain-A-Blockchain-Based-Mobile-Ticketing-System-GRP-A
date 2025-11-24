#!/usr/bin/env node

/**
 * All-in-one script to deploy contract and update app configuration
 * Usage: npm run deploy-and-update <network>
 * Example: npm run deploy-and-update amoy
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NETWORKS = {
  local: {
    name: 'Hardhat Local',
    chainId: 1337,
    faucet: null,
    explorer: null,
  },
  localhost: {
    name: 'Localhost',
    chainId: 1337,
    faucet: null,
    explorer: null,
  },
  amoy: {
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    faucet: 'https://faucet.polygon.technology/',
    explorer: 'https://amoy.polygonscan.com',
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    faucet: null,
    explorer: 'https://polygonscan.com',
  },
};

function executeCommand(command, description) {
  console.log(`\n⏳ ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${description}`);
    return false;
  }
}

async function deploy(network) {
  const networkConfig = NETWORKS[network];

  if (!networkConfig) {
    console.error(`❌ Unknown network: ${network}`);
    console.log('Available networks:', Object.keys(NETWORKS).join(', '));
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log(`║  Deploying to ${networkConfig.name.padEnd(43)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Step 1: Pre-deployment checks
  console.log('\n📋 Pre-deployment Checklist:');

  // Check if .env exists
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found in contracts directory');
    console.log('   Please create a .env file with PRIVATE_KEY');
    process.exit(1);
  }
  console.log('✅ .env file found');

  // Check if PRIVATE_KEY is set
  require('dotenv').config({ path: envPath });
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env');
    console.log('   Please add PRIVATE_KEY to your .env file');
    process.exit(1);
  }
  console.log('✅ PRIVATE_KEY configured');

  // Check wallet balance for non-local networks
  if (network !== 'local' && network !== 'localhost') {
    console.log('\n💰 Checking wallet balance...');
    const checkBalance = executeCommand(
      `npx hardhat run scripts/checkBalance.js --network ${network}`,
      'Checking balance'
    );

    if (!checkBalance) {
      console.log(`\n⚠️  Warning: Could not verify wallet balance`);
      if (networkConfig.faucet) {
        console.log(`   Get test tokens from: ${networkConfig.faucet}`);
      }
      console.log('   Continuing anyway...');
    }
  }

  // Step 2: Compile contracts
  if (!executeCommand('npm run compile', 'Compiling contracts')) {
    process.exit(1);
  }

  // Step 3: Deploy
  if (!executeCommand(`npx hardhat run deploy.js --network ${network}`, `Deploying to ${network}`)) {
    process.exit(1);
  }

  // Step 4: Read deployment info
  const deploymentPath = path.join(__dirname, `../contracts/deployments/${network}.json`);
  let deployment;
  try {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  } catch (error) {
    console.error('❌ Could not read deployment file');
    process.exit(1);
  }

  console.log('\n✅ Deployment successful!');
  console.log(`   Contract Address: ${deployment.contractAddress}`);
  console.log(`   Network: ${deployment.network}`);
  console.log(`   Chain ID: ${deployment.chainId}`);

  // Step 5: Update app configuration
  executeCommand(`node scripts/updateAppConfig.js ${network}`, 'Updating app configuration');

  // Step 6: Final instructions
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Deployment Complete!                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n📋 Post-Deployment Steps:');
  console.log('\n1️⃣  Update Active Network:');
  console.log('   Edit utils/contracts/config.ts and change:');
  console.log(`   export const ACTIVE_NETWORK = NETWORKS.${network.toUpperCase()};`);

  console.log('\n2️⃣  Restart Development Server:');
  console.log('   cd ..');
  console.log('   bun start');

  console.log('\n3️⃣  Test the Integration:');
  console.log('   - Create a blockchain event');
  console.log('   - Purchase a ticket');
  console.log('   - Verify the transaction');

  if (networkConfig.explorer) {
    console.log('\n4️⃣  View on Block Explorer:');
    console.log(`   ${networkConfig.explorer}/address/${deployment.contractAddress}`);
  }

  if (network === 'amoy') {
    console.log('\n💡 Pro Tips for Polygon Amoy:');
    console.log('   - Get free test MATIC: https://faucet.polygon.technology/');
    console.log('   - Transactions take 2-5 seconds (vs instant on local)');
    console.log('   - Fund user wallets with test MATIC before they can interact');
    console.log('   - Consider implementing gasless transactions for better UX');
  }

  if (network === 'polygon') {
    console.log('\n⚠️  POLYGON MAINNET DEPLOYMENT - IMPORTANT:');
    console.log('   ⚠️  You are now on MAINNET with real MATIC!');
    console.log('   ⚠️  All transactions cost real money');
    console.log('   ⚠️  Ensure contract is audited before going live');
    console.log('   ⚠️  Test thoroughly on Amoy testnet first');
  }

  console.log('\n✨ Happy building! ✨\n');
}

// Get network from command line
const network = process.argv[2];

if (!network) {
  console.error('❌ Please specify a network');
  console.log('\nUsage: node scripts/deployAndUpdate.js <network>');
  console.log('\nAvailable networks:');
  Object.entries(NETWORKS).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(10)} - ${config.name}`);
  });
  console.log('\nExample: node scripts/deployAndUpdate.js amoy');
  process.exit(1);
}

deploy(network);
