#!/usr/bin/env node

/**
 * Script to automatically update React Native app config with deployed contract address
 * Usage: node scripts/updateAppConfig.js <network>
 * Example: node scripts/updateAppConfig.js amoy
 */

const fs = require("fs");
const path = require("path");

function updateAppConfig(network) {
  // Read deployment info
  const deploymentPath = path.join(__dirname, `../contracts/deployments/${network}.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    console.error(`Please deploy to ${network} first using: npm run deploy:${network}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contractAddress;
  const chainId = deployment.chainId;

  console.log(`📝 Updating app config with deployment from ${network}:`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Chain ID: ${chainId}`);

  // Update utils/contracts/config.ts
  const configPath = path.join(__dirname, '../../utils/contracts/config.ts');

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }

  let configContent = fs.readFileSync(configPath, 'utf8');

  // Determine network key
  let networkKey;
  if (network === 'amoy' || chainId === 80002) {
    networkKey = 'AMOY';
  } else if (network === 'polygon' || chainId === 137) {
    networkKey = 'POLYGON';
  } else if (network === 'localhost' || network === 'hardhat') {
    networkKey = 'LOCAL';
  } else {
    console.error(`❌ Unknown network: ${network}`);
    process.exit(1);
  }

  // Update contract address for the network
  const addressPattern = new RegExp(
    `(\\[NETWORKS\\.${networkKey}\\]:\\s*['"])0x[0-9a-fA-F]{40}(['"]\\s+as\\s+\`0x\\$\\{string\\}\`)`,
    'g'
  );

  const newConfigContent = configContent.replace(
    addressPattern,
    `$1${contractAddress}$2`
  );

  if (newConfigContent === configContent) {
    console.warn(`⚠️  Warning: Could not find pattern to update for network ${networkKey}`);
    console.log(`   Please manually update the contract address in ${configPath}`);
    console.log(`   Set NETWORKS.${networkKey} to: ${contractAddress}`);
  } else {
    fs.writeFileSync(configPath, newConfigContent);
    console.log(`✅ Updated ${configPath}`);
  }

  // Print next steps
  console.log('\n📋 Next Steps:');
  console.log(`   1. Update ACTIVE_NETWORK in utils/contracts/config.ts to NETWORKS.${networkKey}`);
  console.log(`   2. Restart your development server: bun start`);
  console.log(`   3. Test the integration in your app`);

  if (network === 'amoy') {
    console.log(`   4. View contract on PolygonScan: https://amoy.polygonscan.com/address/${contractAddress}`);
  } else if (network === 'polygon') {
    console.log(`   4. View contract on PolygonScan: https://polygonscan.com/address/${contractAddress}`);
  }
}

// Get network from command line argument
const network = process.argv[2];

if (!network) {
  console.error('❌ Please specify a network');
  console.log('Usage: node scripts/updateAppConfig.js <network>');
  console.log('Example: node scripts/updateAppConfig.js amoy');
  process.exit(1);
}

updateAppConfig(network);
