import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import {
  createEvent as createBlockchainEvent,
  mintTicket as mintBlockchainTicket,
  waitForTransaction,
  createLocalPublicClient,
  createLocalWalletClient,
  toWei,
} from "@/utils/contracts/ticketContract";
import {
  getUserPrivateKey,
  getUserWalletAddress,
} from "@/utils/wallet/walletManager";
import {
  fundWalletFromTestAccount,
  checkWalletBalance,
} from "@/utils/wallet/fundWallet";
import { ACTIVE_NETWORK, NETWORKS } from "@/utils/contracts/config";
import { privateKeyToAccount } from "viem/accounts";
import type { Address } from "viem";
import { Toast } from "toastify-react-native";

/**
 * Hook to create a blockchain event from a Supabase event
 */
export const useCreateBlockchainEvent = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      priceInEth: string;
      totalSupply: number;
      eventDate: Date;
      royaltyPercent?: number;
      maxResalePriceInEth?: string;
      resaleAllowed?: boolean;
    }) => {
      if (!userId) throw new Error("User not authenticated");

      // Get user's wallet address
      const walletAddress = await getUserWalletAddress(userId);
      if (!walletAddress) {
        throw new Error(
          "No wallet found. Please set up your wallet first:\n" +
          "1. Go to Profile tab\n" +
          "2. Tap 'My Wallet'\n" +
          "3. Choose 'Quick Wallet' or connect external wallet"
        );
      }

      // Get user's private key (only for custodial wallets)
      const privateKey = await getUserPrivateKey(userId);
      if (!privateKey) {
        throw new Error(
          "Wallet is not a custodial wallet. Creating blockchain events requires a custodial wallet for now."
        );
      }

      // Check wallet balance (for logging purposes)
      const { balance, balanceInEth } = await checkWalletBalance(
        walletAddress as Address,
      );
      const currencySymbol =
        ACTIVE_NETWORK === NETWORKS.LOCAL ? "ETH" : "MATIC";
      console.log(
        `Wallet ${walletAddress} balance: ${balanceInEth} ${currencySymbol}`,
      );

      // Only check/fund on local network
      if (ACTIVE_NETWORK === NETWORKS.LOCAL) {
        const minBalance = BigInt(50000000000000000); // 0.05 ETH in wei
        if (balance < minBalance) {
          console.log("Wallet balance too low, funding from test account...");
          const fundHash = await fundWalletFromTestAccount(
            walletAddress as Address,
            "10",
          );
          const publicClient = createLocalPublicClient();
          await waitForTransaction(fundHash, publicClient);
          console.log("Wallet funded successfully!");
        }
      }
      // On testnet/mainnet, let the transaction fail naturally if insufficient funds
      // This way users can try with whatever balance they have

      // Get event from Supabase to generate blockchain event ID
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.eventId)
        .single();

      if (eventError || !event) throw new Error("Event not found");

      const blockchainEventId = `event-${params.eventId}`;

      // Create wallet client
      const walletClient = createLocalWalletClient(privateKey);

      // Create event on blockchain
      const hash = await createBlockchainEvent(
        {
          eventId: blockchainEventId,
          price: toWei(params.priceInEth),
          totalSupply: BigInt(params.totalSupply),
          royaltyPercent: BigInt(params.royaltyPercent || 500),
          maxResalePrice: toWei(params.maxResalePriceInEth || "0"),
          resaleAllowed: params.resaleAllowed ?? true,
          eventDate: BigInt(Math.floor(params.eventDate.getTime() / 1000)),
        },
        walletClient,
      );

      // Wait for transaction to be mined
      const publicClient = createLocalPublicClient();
      const receipt = await waitForTransaction(hash, publicClient);

      // Update Supabase event with blockchain info
      const { error: updateError } = await supabase
        .from("events")
        .update({
          blockchain_enabled: true,
          blockchain_event_id: blockchainEventId,
          total_supply: params.totalSupply,
          tickets_sold: 0,
          blockchain_active: true,
          royalty_percent: params.royaltyPercent || 500,
          max_resale_price: parseFloat(params.maxResalePriceInEth || "0"),
          resale_allowed: params.resaleAllowed ?? true,
        })
        .eq("id", params.eventId);

      if (updateError) throw updateError;

      // Log transaction in blockchain_transactions table
      await supabase.from("blockchain_transactions").insert({
        user_id: userId,
        event_id: params.eventId,
        transaction_type: "create_event",
        transaction_hash: hash,
        from_address: walletClient.account.address,
        status: "confirmed",
        block_number: Number(receipt.blockNumber),
      });

      return { hash, receipt, blockchainEventId };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["blockchainEvents"] });
    },
  });
};

/**
 * Hook to purchase/mint a ticket for a blockchain event
 */
export const usePurchaseBlockchainTicket = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { eventId: string; quantity?: number }) => {
      if (!userId) throw new Error("User not authenticated");

      // Get user's wallet address
      const walletAddress = await getUserWalletAddress(userId);
      if (!walletAddress) {
        throw new Error(
          "No wallet found. Please set up your wallet first:\n" +
          "1. Go to Profile tab\n" +
          "2. Tap 'My Wallet'\n" +
          "3. Choose 'Quick Wallet' or connect external wallet"
        );
      }

      // Get user's private key (only for custodial wallets)
      const privateKey = await getUserPrivateKey(userId);
      if (!privateKey) {
        throw new Error(
          "Wallet is not a custodial wallet. Please use the app to purchase tickets with external wallets."
        );
      }

      // Verify private key matches wallet address
      const account = privateKeyToAccount(privateKey);
      console.log(`Retrieved wallet address from DB: ${walletAddress}`);
      console.log(`Derived address from private key: ${account.address}`);

      if (walletAddress.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error(
          `Wallet mismatch! Database has ${walletAddress} but private key derives to ${account.address}. ` +
            `This means you have multiple wallets in the database. Please check your user_wallets table.`,
        );
      }

      // Check wallet balance (for logging purposes)
      const { balance, balanceInEth } = await checkWalletBalance(
        walletAddress as Address,
      );
      const currencySymbol =
        ACTIVE_NETWORK === NETWORKS.LOCAL ? "ETH" : "MATIC";
      console.log(
        `Wallet ${walletAddress} balance: ${balanceInEth} ${currencySymbol}`,
      );

      // Only check/fund on local network
      if (ACTIVE_NETWORK === NETWORKS.LOCAL) {
        const minBalance = BigInt(50000000000000000); // 0.05 ETH in wei
        if (balance < minBalance) {
          console.log("Wallet balance too low, funding from test account...");
          const fundHash = await fundWalletFromTestAccount(
            walletAddress as Address,
            "10",
          );
          const publicClient = createLocalPublicClient();
          await waitForTransaction(fundHash, publicClient);
          console.log("Wallet funded successfully!");
        }
      }
      // On testnet/mainnet, let the transaction fail naturally if insufficient funds
      // This way users can try with whatever balance they have

      // Get event from Supabase
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.eventId)
        .single();

      if (eventError || !event) throw new Error("Event not found");

      // Auto-enable blockchain for event if not already enabled
      if (!event.blockchain_enabled || !event.blockchain_event_id) {
        console.log("Event not blockchain-enabled, creating blockchain event automatically...");

        // Show toast to user
        Toast.show({
          type: "info",
          text1: "Setting up blockchain",
          text2: "Creating blockchain event, please wait...",
        });

        // Create blockchain event with default parameters
        const defaultPriceInEth = event.blockchain_price?.toString() || "0.001"; // Use blockchain_price or default to 0.001 MATIC
        const defaultTotalSupply = event.total_supply || 1000; // Default to 1000 tickets
        const eventDate = event.time ? new Date(event.time) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Event date or 30 days from now

        const blockchainEventId = `event-${params.eventId}`;

        // Create wallet client for blockchain event creation
        const walletClientForEvent = createLocalWalletClient(privateKey);

        // Create event on blockchain
        let createHash: `0x${string}` | undefined;
        let createReceipt: any;
        let blockchainCreated = false;

        try {
          // Step 1: Create event on blockchain
          createHash = await createBlockchainEvent(
            {
              eventId: blockchainEventId,
              price: toWei(defaultPriceInEth),
              totalSupply: BigInt(defaultTotalSupply),
              royaltyPercent: BigInt(event.royalty_percent || 500),
              maxResalePrice: toWei(event.max_resale_price?.toString() || "0"),
              resaleAllowed: event.resale_allowed ?? true,
              eventDate: BigInt(Math.floor(eventDate.getTime() / 1000)),
            },
            walletClientForEvent,
          );

          console.log("Blockchain event creation transaction hash:", createHash);

          // Step 2: Wait for transaction to be mined
          const publicClient = createLocalPublicClient();
          createReceipt = await waitForTransaction(createHash, publicClient);
          blockchainCreated = true;

          console.log("Blockchain event created successfully!");

          // Step 3: Update Supabase event with blockchain info
          const { error: updateError } = await supabase
            .from("events")
            .update({
              blockchain_enabled: true,
              blockchain_event_id: blockchainEventId,
              total_supply: defaultTotalSupply,
              tickets_sold: 0,
              blockchain_active: true,
              royalty_percent: event.royalty_percent || 500,
              max_resale_price: parseFloat(event.max_resale_price?.toString() || "0"),
              resale_allowed: event.resale_allowed ?? true,
              blockchain_price: parseFloat(defaultPriceInEth),
            })
            .eq("id", params.eventId);

          if (updateError) {
            console.error("Error updating event with blockchain info:", updateError);
            throw updateError;
          }

          // Step 4: Log transaction in blockchain_transactions table
          await supabase.from("blockchain_transactions").insert({
            user_id: userId,
            event_id: params.eventId,
            transaction_type: "create_event",
            transaction_hash: createHash,
            from_address: walletClientForEvent.account.address,
            status: "confirmed",
            block_number: Number(createReceipt.blockNumber),
          });

          // Update the event object with blockchain info for the next steps
          event.blockchain_enabled = true;
          event.blockchain_event_id = blockchainEventId;
          event.blockchain_price = parseFloat(defaultPriceInEth);

          console.log("Event updated in database with blockchain info");

          // Show success toast
          Toast.show({
            type: "success",
            text1: "Blockchain enabled!",
            text2: "Event is now ready for NFT tickets",
          });
        } catch (createError: any) {
          console.error("Error creating blockchain event:", createError);

          // Rollback: If blockchain was created but database update failed, log it as failed
          if (blockchainCreated && createHash && createReceipt) {
            console.log("Blockchain event was created but database update failed. Logging failed transaction...");

            try {
              await supabase.from("blockchain_transactions").insert({
                user_id: userId,
                event_id: params.eventId,
                transaction_type: "create_event",
                transaction_hash: createHash,
                from_address: walletClientForEvent.account.address,
                status: "failed",
                block_number: Number(createReceipt.blockNumber),
                error_message: createError.message || "Database update failed after blockchain creation",
              });
            } catch (logError) {
              console.error("Failed to log failed transaction:", logError);
            }

            // Show specific error for this case
            Toast.show({
              type: "error",
              text1: "Database update failed",
              text2: "Event created on blockchain but not saved",
            });

            throw new Error(
              "Blockchain event was created but failed to update database. " +
              "Please contact support with transaction hash: " + createHash,
            );
          }

          // Show general error toast for blockchain creation failures
          Toast.show({
            type: "error",
            text1: "Blockchain setup failed",
            text2: "Please try again",
          });

          throw new Error(
            "Failed to create blockchain event. " +
            "Please try again or contact support if the issue persists.",
          );
        }
      }

      // Check if event is actually created on the blockchain
      console.log(
        `Checking if blockchain event exists: ${event.blockchain_event_id}`,
      );

      // Create wallet client
      const walletClient = createLocalWalletClient(privateKey);
      const quantity = params.quantity || 1;
      const tickets: any[] = [];

      // Mint tickets
      for (let i = 0; i < quantity; i++) {
        const tokenURI = `ipfs://tikiti-chain-ticket-${event.id}-${Date.now()}-${i}`;

        // Use blockchain_price if available, otherwise use a small test price (0.01 MATIC)
        // The event.price is in USD, so we can't use it directly
        const blockchainPrice = event.blockchain_price
          ? toWei(event.blockchain_price.toString())
          : toWei("0.001"); // Default to 0.01 MATIC for testing

        console.log(`Minting ticket ${i + 1}/${quantity}`);
        console.log(`Token URI: ${tokenURI}`);
        console.log(
          `Price: ${blockchainPrice} wei (${event.blockchain_price || 0.001} MATIC)`,
        );
        console.log(`Event ID: ${event.blockchain_event_id}`);

        try {
          const hash = await mintBlockchainTicket(
            {
              eventId: event.blockchain_event_id,
              tokenURI,
              price: blockchainPrice,
            },
            walletClient,
          );

          console.log(`Transaction hash: ${hash}`);

          // Wait for transaction to be mined
          const publicClient = createLocalPublicClient();
          const receipt = await waitForTransaction(hash, publicClient);

          console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

          // Extract token ID from transaction logs (simplified - in production, parse logs properly)
          // For now, we'll use a placeholder
          const tokenId = BigInt(Date.now() + i);

          // Store ticket in Supabase
          const { data: ticket, error: ticketError } = await supabase
            .from("blockchain_tickets")
            .insert({
              token_id: tokenId.toString(),
              event_id: params.eventId,
              owner_user_id: userId,
              owner_wallet_address: walletClient.account.address,
              token_uri: tokenURI,
              purchase_price: parseFloat(event.blockchain_price || 0.001),
              transaction_hash: hash,
            })
            .select()
            .single();

          if (ticketError) throw ticketError;

          // Log transaction
          await supabase.from("blockchain_transactions").insert({
            user_id: userId,
            event_id: params.eventId,
            transaction_type: "mint_ticket",
            transaction_hash: hash,
            from_address: walletClient.account.address,
            value_eth: parseFloat(event.blockchain_price || 0.001),
            status: "confirmed",
            block_number: Number(receipt.blockNumber),
          });

          // Add user to attendees if this is their first ticket for this event
          if (i === 0) {
            // Check if attend interaction already exists
            const { data: existingAttend } = await supabase
              .from("user_interactions")
              .select("id")
              .eq("user_id", userId)
              .eq("event_id", params.eventId)
              .eq("interaction_type", "attend")
              .maybeSingle();

            // Only add if not already attending
            if (!existingAttend) {
              await supabase.from("user_interactions").insert({
                user_id: userId,
                event_id: params.eventId,
                interaction_type: "attend",
              });
              console.log("Added user to event attendees");
            }
          }

          tickets.push({ hash, receipt, ticket });
        } catch (error: any) {
          console.error(`Failed to mint ticket ${i + 1}:`, error);

          // Check for specific errors
          if (error.message?.includes("insufficient funds")) {
            throw new Error(
              `Insufficient funds in wallet ${walletAddress}.\n\n` +
                `Required: ~${event.blockchain_price || 0.001} MATIC + gas fees\n` +
                `Current balance: ${balanceInEth} MATIC\n\n` +
                `Please fund your wallet at:\nhttps://faucet.polygon.technology/`,
            );
          }

          throw new Error(`Failed to mint ticket: ${error.message || error}`);
        }
      }

      // Update event tickets_sold count
      await supabase.rpc("increment_tickets_sold", {
        event_id: params.eventId,
        amount: quantity,
      });

      return tickets;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["userTickets"] });
      queryClient.invalidateQueries({ queryKey: ["blockchainTickets"] });
      // Invalidate attendee and interaction queries since we added attend interaction
      queryClient.invalidateQueries({ queryKey: ["event-attendees", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-interactions", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-interactions", variables.eventId] });
    },
  });
};

/**
 * Hook to get user's blockchain tickets
 */
export const useUserBlockchainTickets = (eventId?: string) => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["blockchainTickets", userId, eventId],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from("user_blockchain_tickets_view")
        .select("*")
        .eq("owner_user_id", userId);

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

/**
 * Hook to check if event is blockchain enabled
 */
export const useIsBlockchainEvent = (eventId: string) => {
  return useQuery({
    queryKey: ["event", eventId, "blockchain"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("blockchain_enabled, blockchain_event_id, blockchain_active")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};
