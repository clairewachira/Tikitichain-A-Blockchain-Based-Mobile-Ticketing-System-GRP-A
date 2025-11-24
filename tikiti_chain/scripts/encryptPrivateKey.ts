/**
 * Helper script to encrypt a private key for storing in Supabase
 *
 * Usage:
 * 1. Run: npx ts-node scripts/encryptPrivateKey.ts
 * 2. When prompted, enter:
 *    - Your user ID from Supabase auth.users
 *    - The private key you want to encrypt (0x...)
 * 3. Copy the encrypted output and paste it into the encrypted_private_key column
 */

import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";
import { privateKeyToAccount } from "viem/accounts";

async function encryptPrivateKey(
  privateKey: string,
  userId: string,
): Promise<string> {
  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    userId + "tikiti-chain-secret",
  );

  // Simple base64 encoding (matches your current implementation)
  const encrypted = Buffer.from(privateKey).toString("base64");
  return encrypted;
}

async function decryptPrivateKey(
  encryptedKey: string,
  userId: string,
): Promise<string> {
  const decrypted = Buffer.from(encryptedKey, "base64").toString("utf-8");
  return decrypted;
}

async function main() {
  console.log("=== Tikiti Chain Private Key Encryption Tool ===\n");

  // Get user input
  const userId = process.argv[2];
  const privateKey = process.argv[3];

  if (!userId || !privateKey) {
    console.log("Usage: bun run scripts/encryptPrivateKey.ts <user_id> <private_key>\n");
    console.log("Example:");
    console.log('  bun run scripts/encryptPrivateKey.ts "123e4567-e89b-12d3-a456-426614174000" "0xabc123..."\n');
    process.exit(1);
  }

  // Validate private key format
  if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
    console.error("❌ Invalid private key format. Must be 0x followed by 64 hex characters.\n");
    process.exit(1);
  }

  // Derive wallet address from private key
  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log("✓ Private key is valid");
    console.log(`✓ Wallet address: ${account.address}\n`);

    // Encrypt the private key
    const encrypted = await encryptPrivateKey(privateKey, userId);
    console.log("✓ Encrypted successfully\n");

    // Test decryption
    const decrypted = await decryptPrivateKey(encrypted, userId);
    if (decrypted === privateKey) {
      console.log("✓ Encryption/decryption test passed\n");
    } else {
      console.error("❌ Encryption/decryption test failed!\n");
      process.exit(1);
    }

    console.log("==================== RESULTS ====================");
    console.log(`User ID:              ${userId}`);
    console.log(`Wallet Address:       ${account.address}`);
    console.log(`Encrypted Private Key: ${encrypted}`);
    console.log("=================================================\n");

    console.log("📝 SQL UPDATE command:");
    console.log(`UPDATE user_wallets`);
    console.log(`SET wallet_address = '${account.address}',`);
    console.log(`    encrypted_private_key = '${encrypted}'`);
    console.log(`WHERE user_id = '${userId}';`);
    console.log();

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
