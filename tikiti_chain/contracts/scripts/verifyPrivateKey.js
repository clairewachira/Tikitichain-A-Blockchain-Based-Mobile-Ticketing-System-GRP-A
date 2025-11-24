#!/usr/bin/env node

/**
 * Script to verify private key and show corresponding wallet address
 */

require('dotenv').config();
const { Wallet } = require('ethers');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  Private Key Verification                                 ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check if PRIVATE_KEY exists
if (!process.env.PRIVATE_KEY) {
  console.error('❌ PRIVATE_KEY not found in .env file');
  console.log('\nPlease add PRIVATE_KEY to your .env file:');
  console.log('   PRIVATE_KEY=your_private_key_here\n');
  process.exit(1);
}

let privateKey = process.env.PRIVATE_KEY;

// Ensure private key has 0x prefix for ethers.js
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

try {
  // Create wallet from private key
  const wallet = new Wallet(privateKey);

  console.log('✅ Private key is valid!\n');
  console.log('Wallet Address:', wallet.address);
  console.log('Private Key:   ', privateKey);

  console.log('\n📋 Next Steps:');
  console.log('   1. Copy the wallet address above');
  console.log('   2. Go to https://faucet.polygon.technology/');
  console.log('   3. Select "Polygon Amoy" network');
  console.log('   4. Paste your wallet address');
  console.log('   5. Complete verification and get free test MATIC');
  console.log('   6. Run: npm run balance:amoy');
  console.log('   7. Once funded, run: npm run deploy:amoy\n');

} catch (error) {
  console.error('❌ Invalid private key format');
  console.error('Error:', error.message);
  console.log('\nPrivate key should be:');
  console.log('   - 64 hexadecimal characters (without 0x prefix), OR');
  console.log('   - 66 characters (with 0x prefix)');
  console.log('\nExample:');
  console.log('   PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\n');
  process.exit(1);
}
