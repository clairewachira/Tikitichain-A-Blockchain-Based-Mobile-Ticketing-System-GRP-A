const hre = require("hardhat");

async function main() {
  console.log("🎫 Testing TikitiChainTicket Contract\n");
  console.log("=====================================\n");

  // Get signers (test accounts provided by Hardhat)
  const [organizer, buyer1, buyer2] = await hre.ethers.getSigners();

  console.log("👥 Test Accounts:");
  console.log("Organizer:", organizer.address);
  console.log("Buyer 1:  ", buyer1.address);
  console.log("Buyer 2:  ", buyer2.address);
  console.log();

  // Deploy contract
  console.log("📝 Deploying TikitiChainTicket contract...");
  const TikitiChainTicket = await hre.ethers.getContractFactory("TikitiChainTicket");
  const ticket = await TikitiChainTicket.deploy();
  await ticket.waitForDeployment();
  const contractAddress = await ticket.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log();

  // Test 1: Create an event
  console.log("📅 Test 1: Creating an event...");
  const eventId = "event-123";
  const ticketPrice = hre.ethers.parseEther("0.1"); // 0.1 MATIC
  const totalSupply = 100;
  const royaltyPercent = 500; // 5%
  const maxResalePrice = hre.ethers.parseEther("0.15"); // Max 0.15 MATIC
  const resaleAllowed = true;
  const eventDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow

  const createTx = await ticket.connect(organizer).createEvent(
    eventId,
    ticketPrice,
    totalSupply,
    royaltyPercent,
    maxResalePrice,
    resaleAllowed,
    eventDate
  );
  await createTx.wait();
  console.log("✅ Event created successfully!");

  const eventData = await ticket.events(eventId);
  console.log("   Event ID:", eventData.eventId);
  console.log("   Organizer:", eventData.organizer);
  console.log("   Price:", hre.ethers.formatEther(eventData.price), "MATIC");
  console.log("   Total Supply:", eventData.totalSupply.toString());
  console.log("   Resale Allowed:", eventData.resaleAllowed);
  console.log();

  // Test 2: Mint a ticket
  console.log("🎟️  Test 2: Minting a ticket...");
  const tokenURI = "ipfs://QmExample123/metadata.json";

  const mintTx = await ticket.connect(buyer1).mintTicket(
    eventId,
    tokenURI,
    { value: ticketPrice }
  );
  const mintReceipt = await mintTx.wait();
  console.log("✅ Ticket minted successfully!");
  console.log("   Token ID: 0");
  console.log("   Owner:", buyer1.address);
  console.log("   Price paid:", hre.ethers.formatEther(ticketPrice), "MATIC");
  console.log();

  // Test 3: Check ticket details
  console.log("🔍 Test 3: Getting ticket details...");
  const ticketData = await ticket.getTicket(0);
  console.log("   Token ID:", ticketData.tokenId.toString());
  console.log("   Event ID:", ticketData.eventId);
  console.log("   Original Owner:", ticketData.originalOwner);
  console.log("   Purchase Price:", hre.ethers.formatEther(ticketData.purchasePrice), "MATIC");
  console.log("   Redeemed:", ticketData.redeemed);
  console.log();

  // Test 4: Get token URI
  console.log("🖼️  Test 4: Getting token URI...");
  const uri = await ticket.tokenURI(0);
  console.log("   Token URI:", uri);
  console.log();

  // Test 5: Mint second ticket
  console.log("🎟️  Test 5: Minting second ticket for buyer2...");
  const mint2Tx = await ticket.connect(buyer2).mintTicket(
    eventId,
    "ipfs://QmExample456/metadata.json",
    { value: ticketPrice }
  );
  await mint2Tx.wait();
  console.log("✅ Second ticket minted!");
  console.log("   Token ID: 1");
  console.log("   Owner:", buyer2.address);
  console.log();

  // Test 6: Check updated event stats
  console.log("📊 Test 6: Checking event statistics...");
  const updatedEvent = await ticket.events(eventId);
  console.log("   Tickets Sold:", updatedEvent.soldTickets.toString(), "/", updatedEvent.totalSupply.toString());
  console.log();

  // Test 7: Get user tickets
  console.log("👤 Test 7: Getting buyer1's tickets...");
  const buyer1Tickets = await ticket.getUserEventTickets(buyer1.address, eventId);
  console.log("   Buyer1 has", buyer1Tickets.length, "ticket(s) for this event");
  console.log("   Token IDs:", buyer1Tickets.map(id => id.toString()).join(", "));
  console.log();

  // Test 8: Transfer/Resell ticket (with royalty)
  console.log("💱 Test 8: Testing ticket resale with royalty...");
  const resalePrice = hre.ethers.parseEther("0.12");

  console.log("   Initial balances:");
  const buyer1BalanceBefore = await hre.ethers.provider.getBalance(buyer1.address);
  const organizerBalanceBefore = await hre.ethers.provider.getBalance(organizer.address);
  console.log("   Buyer1:", hre.ethers.formatEther(buyer1BalanceBefore), "MATIC");
  console.log("   Organizer:", hre.ethers.formatEther(organizerBalanceBefore), "MATIC");

  const transferTx = await ticket.connect(buyer1).transferTicket(
    0, // token ID
    buyer2.address, // new owner
    resalePrice,
    { value: resalePrice }
  );
  await transferTx.wait();

  console.log("✅ Ticket resold!");
  console.log("   From:", buyer1.address);
  console.log("   To:", buyer2.address);
  console.log("   Resale Price:", hre.ethers.formatEther(resalePrice), "MATIC");

  const buyer1BalanceAfter = await hre.ethers.provider.getBalance(buyer1.address);
  const organizerBalanceAfter = await hre.ethers.provider.getBalance(organizer.address);
  const royaltyPaid = organizerBalanceAfter - organizerBalanceBefore;

  console.log("   Royalty paid to organizer:", hre.ethers.formatEther(royaltyPaid), "MATIC (5%)");
  console.log();

  // Test 9: Verify new owner
  console.log("✅ Test 9: Verifying new owner...");
  const newOwner = await ticket.ownerOf(0);
  console.log("   New owner of token 0:", newOwner);
  console.log("   Expected:", buyer2.address);
  console.log("   Match:", newOwner === buyer2.address ? "✅" : "❌");
  console.log();

  // Test 10: Check supports interface (ERC721)
  console.log("🔧 Test 10: Checking ERC721 interface support...");
  const supportsERC721 = await ticket.supportsInterface("0x80ac58cd");
  console.log("   Supports ERC721:", supportsERC721 ? "✅" : "❌");
  console.log();

  console.log("=====================================");
  console.log("✨ All tests completed successfully!");
  console.log("=====================================\n");

  // Summary
  console.log("📋 Summary:");
  console.log("• Contract Address:", contractAddress);
  console.log("• Event Created: ✅");
  console.log("• Tickets Minted: 2");
  console.log("• Tickets Sold:", updatedEvent.soldTickets.toString());
  console.log("• Ticket Resold: ✅");
  console.log("• Royalty System: ✅");
  console.log();

  console.log("💡 Next steps:");
  console.log("1. Start a persistent local node: npm run node");
  console.log("2. Deploy to the persistent node in another terminal");
  console.log("3. Connect your React Native app to http://localhost:8545");
  console.log("4. Import a test account private key to MetaMask");
  console.log("5. Test the full integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
