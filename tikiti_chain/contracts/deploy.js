const hre = require("hardhat");

async function main() {
  console.log("Deploying TikitiChainTicket contract...");

  // Get the contract factory
  const TikitiChainTicket = await hre.ethers.getContractFactory("TikitiChainTicket");

  // Deploy the contract
  const tikitiChainTicket = await TikitiChainTicket.deploy();

  await tikitiChainTicket.waitForDeployment();

  const address = await tikitiChainTicket.getAddress();

  console.log("TikitiChainTicket deployed to:", address);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress: address,
    deployedAt: new Date().toISOString(),
    contractName: "TikitiChainTicket"
  };

  const deploymentsDir = "./contracts/deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    `${deploymentsDir}/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info saved to ${deploymentsDir}/${hre.network.name}.json`);

  // Wait for block confirmations before verifying
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await tikitiChainTicket.deploymentTransaction().wait(6);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Error verifying contract:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
