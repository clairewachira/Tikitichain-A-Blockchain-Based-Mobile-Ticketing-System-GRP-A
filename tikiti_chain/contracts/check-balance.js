const hre = require("hardhat");

async function main() {
  console.log("💰 Checking Account Balances\n");
  console.log("Network:", hre.network.name);
  console.log("=====================================\n");

  const signers = await hre.ethers.getSigners();

  for (let i = 0; i < Math.min(signers.length, 5); i++) {
    const signer = signers[i];
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log(`Account #${i}:`);
    console.log(`  Address: ${signer.address}`);
    console.log(`  Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log();
  }

  console.log("=====================================");
  console.log(`Showing first 5 of ${signers.length} accounts`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
