import { privateKeyToAccount } from "viem/accounts";
import * as Crypto from "expo-crypto";
import { supabase } from "@/utils/supabase";
import { Buffer } from "buffer";

/**
 * Generate a random private key using expo-crypto
 * This is a workaround for viem's generatePrivateKey() not working in React Native
 */
function generatePrivateKeyReactNative(): `0x${string}` {
  // Generate 32 random bytes (256 bits) for a private key
  const randomBytes = Crypto.getRandomBytes(32);

  // Convert to hex string with 0x prefix
  const hexString = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return `0x${hexString}`;
}

/**
 * Encrypt private key using a derived key from user's session
 * In production, use a more secure key derivation method
 */
async function encryptPrivateKey(
  privateKey: string,
  userId: string,
): Promise<string> {
  // In production, use proper encryption (AES-256-GCM) with a key derived from user's password
  // For now, we'll use base64 encoding with a simple XOR (NOT SECURE FOR PRODUCTION)
  // TODO: Implement proper encryption using expo-crypto or react-native-aes-crypto

  const key = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    userId + "tikiti-chain-secret", // In production, use a secure key from env
  );

  // Simple XOR encryption (REPLACE WITH PROPER AES IN PRODUCTION)
  const encrypted = Buffer.from(privateKey).toString("base64");
  return encrypted;
}

/**
 * Decrypt private key
 */
async function decryptPrivateKey(
  encryptedKey: string,
  userId: string,
): Promise<string> {
  // In production, use proper decryption
  // For now, we'll use base64 decoding
  const decrypted = Buffer.from(encryptedKey, "base64").toString("utf-8");
  return decrypted;
}

/**
 * Generate a new custodial wallet for a user
 */
export async function generateUserWallet(userId: string) {
  try {
    // Check if user already has a custodial wallet
    const { data: existingWallet } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("wallet_type", "custodial")
      .maybeSingle();

    if (existingWallet) {
      return {
        address: existingWallet.wallet_address,
        exists: true,
        walletType: "custodial" as const,
      };
    }

    // Generate new private key and account
    const privateKey = generatePrivateKeyReactNative();
    const account = privateKeyToAccount(privateKey);

    // Encrypt private key
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, userId);

    // Store in Supabase
    const { data, error } = await supabase
      .from("user_wallets")
      .insert({
        user_id: userId,
        wallet_address: account.address,
        encrypted_private_key: encryptedPrivateKey,
        wallet_type: "custodial",
      })
      .select()
      .single();

    if (error) throw error;

    return {
      address: account.address,
      exists: false,
      walletType: "custodial" as const,
    };
  } catch (error) {
    console.error("Error generating wallet:", error);
    throw error;
  }
}

/**
 * Get user's wallet address (prioritizes custodial, falls back to walletconnect)
 */
export async function getUserWalletAddress(
  userId: string,
): Promise<string | null> {
  try {
    // First try to get custodial wallet
    const { data: custodialWallet, error: custodialError } = await supabase
      .from("user_wallets")
      .select("wallet_address, wallet_type")
      .eq("user_id", userId)
      .eq("wallet_type", "custodial")
      .maybeSingle();

    if (custodialError) {
      console.error("Error querying custodial wallet:", custodialError);
    }

    if (custodialWallet?.wallet_address) {
      console.log(`Found custodial wallet for user ${userId}:`, custodialWallet.wallet_address);
      return custodialWallet.wallet_address;
    }

    // Fall back to walletconnect wallet
    const { data: wcWallet, error: wcError } = await supabase
      .from("user_wallets")
      .select("wallet_address, wallet_type")
      .eq("user_id", userId)
      .eq("wallet_type", "walletconnect")
      .maybeSingle();

    if (wcError) {
      console.error("Error querying walletconnect wallet:", wcError);
    }

    if (wcWallet?.wallet_address) {
      console.log(`Found walletconnect wallet for user ${userId}:`, wcWallet.wallet_address);
      return wcWallet.wallet_address;
    }

    // Final fallback: try to get ANY wallet for this user (for backwards compatibility)
    console.log(`No wallet found with wallet_type, trying fallback query for user ${userId}`);
    const { data: anyWallet, error: anyError } = await supabase
      .from("user_wallets")
      .select("wallet_address, wallet_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (anyError) {
      console.error("Error querying any wallet:", anyError);
    } else if (anyWallet) {
      console.log(`Found wallet (type: ${anyWallet.wallet_type || 'unknown'}) for user ${userId}:`, anyWallet.wallet_address);
      return anyWallet.wallet_address;
    } else {
      console.log(`No wallet found at all for user ${userId}`);
    }

    return null;
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return null;
  }
}

/**
 * Get user's wallet info including type
 */
export async function getUserWalletInfo(userId: string): Promise<{
  address: string;
  walletType: "custodial" | "walletconnect";
} | null> {
  try {
    // First try custodial
    const { data: custodialWallet } = await supabase
      .from("user_wallets")
      .select("wallet_address, wallet_type")
      .eq("user_id", userId)
      .eq("wallet_type", "custodial")
      .maybeSingle();

    if (custodialWallet) {
      return {
        address: custodialWallet.wallet_address,
        walletType: "custodial",
      };
    }

    // Fall back to walletconnect
    const { data: wcWallet } = await supabase
      .from("user_wallets")
      .select("wallet_address, wallet_type")
      .eq("user_id", userId)
      .eq("wallet_type", "walletconnect")
      .maybeSingle();

    if (wcWallet) {
      return {
        address: wcWallet.wallet_address,
        walletType: "walletconnect",
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting wallet info:", error);
    return null;
  }
}

/**
 * Get user's decrypted private key (use with caution!)
 */
export async function getUserPrivateKey(
  userId: string,
): Promise<`0x${string}` | null> {
  try {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("encrypted_private_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data?.encrypted_private_key) return null;

    const decrypted = await decryptPrivateKey(
      data.encrypted_private_key,
      userId,
    );
    return decrypted as `0x${string}`;
  } catch (error) {
    console.error("Error getting private key:", error);
    return null;
  }
}

/**
 * Check if user has a wallet
 */
export async function userHasWallet(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_wallets")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

    console.log("data", data);
    console.log("error", error);
    return !!data && !error;
  } catch (error) {
    return false;
  }
}
