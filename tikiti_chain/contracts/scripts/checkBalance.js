const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(address);
  const balanceInEth = hre.ethers.formatEther(balance);

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Wallet Balance Check                                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`Network:        ${hre.network.name}`);
  console.log(`Chain ID:       ${hre.network.config.chainId}`);
  console.log(`Wallet Address: ${address}`);
  console.log(`Balance:        ${balanceInEth} ${getCurrencySymbol(hre.network.config.chainId)}`);

  // Check if balance is sufficient
  const minBalance = 0.1;
  if (parseFloat(balanceInEth) < minBalance) {
    console.log(`\n⚠️  Warning: Balance is low (< ${minBalance} ${getCurrencySymbol(hre.network.config.chainId)})`);

    if (hre.network.config.chainId === 80002) {
      console.log(`\nGet free test MATIC from:`);
      console.log(`  🔗 https://faucet.polygon.technology/`);
      console.log(`  🔗 https://www.alchemy.com/faucets/polygon-amoy`);
    } else if (hre.network.config.chainId === 11155111) {
      console.log(`\nGet free Sepolia ETH from:`);
      console.log(`  🔗 https://sepoliafaucet.com/`);
      console.log(`  🔗 https://www.alchemy.com/faucets/ethereum-sepolia`);
    }
  } else {
    console.log(`\n✅ Balance is sufficient for deployment`);
  }

  console.log("");
}

function getCurrencySymbol(chainId) {
  switch (chainId) {
    case 137:
    case 80002:
    case 80001:
      return 'MATIC';
    case 1:
    case 11155111:
    case 1337:
      return 'ETH';
    default:
      return 'TOKEN';
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
