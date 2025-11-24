import { Text } from "@/components/ui/Text";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatEther } from "viem";
import Button from "@/components/ui/Button";
import { View, ScrollView, ActivityIndicator, Alert } from "react-native";
import {
  createLocalPublicClient,
  createLocalWalletClient,
  getDefaultTestAccount,
  toWei,
} from "@/utils/contracts/ticketContract";
import { CHAIN_CONFIG, CONTRACTS, getActiveChainConfig, ACTIVE_NETWORK, NETWORKS } from "@/utils/contracts/config";
import {
  useCreateEvent,
  useMintTicket,
  useEvent,
  useUserEventTickets,
} from "@/hooks/blockchain/useTicketContract";

export default function Wallet() {
  const [blockNumber, setBlockNumber] = useState(0n);
  const [gasPrice, setGasPrice] = useState(0n);
  const [balance, setBalance] = useState(0n);
  const [testEventId, setTestEventId] = useState("test-event-" + Date.now());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Get test account for local development
  const testAccount = getDefaultTestAccount();
  const publicClient = createLocalPublicClient();

  // Hooks for contract interactions
  const createEventMutation = useCreateEvent();
  const mintTicketMutation = useMintTicket();
  const { data: eventData, refetch: refetchEvent } = useEvent(testEventId);
  const { data: userTickets, refetch: refetchTickets } = useUserEventTickets(
    testAccount.address,
    testEventId,
  );

  useEffect(() => {
    const getNetworkData = async () => {
      try {
        const [blockNumber, gasPrice, balance] = await Promise.all([
          publicClient.getBlockNumber(),
          publicClient.getGasPrice(),
          publicClient.getBalance({ address: testAccount.address }),
        ]);

        setBlockNumber(blockNumber);
        setGasPrice(gasPrice);
        setBalance(balance);
        setIsConnected(true);
        setConnectionError(null);
      } catch (error: any) {
        setIsConnected(false);
        setConnectionError(error.message || "Network request failed");
        console.error("Network connection error:", error);
      }
    };

    getNetworkData();
    const interval = setInterval(getNetworkData, 10000); // Increased to 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCreateEvent = async () => {
    try {
      const walletClient = createLocalWalletClient(testAccount.privateKey);
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 30); // Event in 30 days

      await createEventMutation.mutateAsync({
        params: {
          eventId: testEventId,
          priceInEth: "0.001",
          totalSupply: 100,
          royaltyPercent: 500, // 5%
          maxResalePriceInEth: "0.05",
          resaleAllowed: true,
          eventDate: eventDate,
        },
        walletClient,
      });

      Alert.alert("Success", "Event created successfully!");
      refetchEvent();
    } catch (error: any) {
      console.error("Error creating event:", error);
      Alert.alert("Error", error.message || "Failed to create event");
    }
  };

  const handleMintTicket = async () => {
    try {
      const walletClient = createLocalWalletClient(testAccount.privateKey);

      await mintTicketMutation.mutateAsync({
        params: {
          eventId: testEventId,
          tokenURI: `ipfs://test-ticket-${Date.now()}`,
          priceInEth: "0.001",
        },
        walletClient,
      });

      Alert.alert("Success", "Ticket minted successfully!");
      refetchEvent();
      refetchTickets();
    } catch (error: any) {
      console.error("Error minting ticket:", error);
      Alert.alert("Error", error.message || "Failed to mint ticket");
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4 pb-32">
        <View className="items-center gap-4 py-6">
          <Text className="text-2xl font-bold">Local Testnet Wallet</Text>

          {/* Connection Status */}
          <View
            className={`w-full rounded-lg p-4 gap-2 ${isConnected ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
          >
            <Text className="font-semibold">
              {isConnected ? "✓ Connected to Local Network" : "✗ Not Connected"}
            </Text>
            {connectionError && (
              <Text className="text-sm">{connectionError}</Text>
            )}
          </View>

          {/* Network Info */}
          <View className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 gap-2">
            <Text className="font-semibold">
              Network: {getActiveChainConfig().name}
            </Text>
            <Text>Chain ID: {getActiveChainConfig().id}</Text>
            <Text>
              RPC URL: {getActiveChainConfig().rpcUrls.default.http[0]}
            </Text>
            <Text>Block: {isConnected ? String(blockNumber) : "N/A"}</Text>
            <Text>
              Gas Price: {isConnected ? formatEther(gasPrice) + " " + (ACTIVE_NETWORK === NETWORKS.LOCAL ? "ETH" : "POL") : "N/A"}
            </Text>
            <Text className="text-xs" numberOfLines={1}>
              Contract: {CONTRACTS.TikitiChainTicket.address}
            </Text>
          </View>

          {/* Account Info */}
          <View className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 gap-2">
            <Text className="font-semibold">Test Account</Text>
            <Text className="text-xs" numberOfLines={1}>
              Address: {testAccount.address}
            </Text>
            <Text>
              Balance: {isConnected ? formatEther(balance) + " " + (ACTIVE_NETWORK === NETWORKS.LOCAL ? "ETH" : "POL") : "N/A"}
            </Text>
          </View>

          {/* Event Info */}
          <View className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 gap-2">
            <Text className="font-semibold">Event Status</Text>
            {eventData ? (
              <>
                <Text>Event ID: {testEventId}</Text>
                <Text>Price: {formatEther((eventData as any).price)} {ACTIVE_NETWORK === NETWORKS.LOCAL ? "ETH" : "POL"}</Text>
                <Text>
                  Sold: {String((eventData as any).soldTickets)} /{" "}
                  {String((eventData as any).totalSupply)}
                </Text>
                <Text>Active: {(eventData as any).active ? "Yes" : "No"}</Text>
              </>
            ) : (
              <Text>No event created yet</Text>
            )}
          </View>

          {/* User Tickets */}
          <View className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4 gap-2">
            <Text className="font-semibold">Your Tickets</Text>
            {userTickets && userTickets.length > 0 ? (
              <Text>You own {userTickets.length} ticket(s)</Text>
            ) : (
              <Text>No tickets yet</Text>
            )}
          </View>

          {/* Actions */}
          <View className="w-full gap-3">
            <Button
              name={
                createEventMutation.isPending
                  ? "Creating Event..."
                  : "Create Test Event"
              }
              onPress={handleCreateEvent}
              disabled={
                createEventMutation.isPending || !!eventData || !isConnected
              }
              className="bg-primary-black px-4 py-3"
            />

            <Button
              name={
                mintTicketMutation.isPending
                  ? "Minting Ticket..."
                  : `Mint Ticket (0.01 ${ACTIVE_NETWORK === NETWORKS.LOCAL ? "ETH" : "POL"})`
              }
              onPress={handleMintTicket}
              disabled={
                mintTicketMutation.isPending || !eventData || !isConnected
              }
              className="bg-secondary-green px-4 py-3"
            />
          </View>

          {/* Instructions */}
          <View className="w-full bg-primary-light_gray rounded-lg p-4 gap-2 mt-4">
            <Text className="font-semibold">
              {isConnected ? "Quick Start Guide:" : "Troubleshooting:"}
            </Text>
            {isConnected ? (
              <>
                <Text>1. Click "Create Test Event" to deploy an event</Text>
                <Text>2. Click "Mint Ticket" to purchase a ticket</Text>
                <Text>3. All transactions are FREE on local testnet!</Text>
              </>
            ) : (
              <>
                <Text>
                  Cannot connect to local blockchain at 127.0.0.1:8545
                </Text>
                <Text className="mt-2 font-semibold">
                  If using iOS Simulator:
                </Text>
                <Text>• Run: cd contracts && bun run node</Text>
                <Text>• 127.0.0.1 should work</Text>
                <Text className="mt-2 font-semibold">
                  If using Android Emulator:
                </Text>
                <Text>• Use 10.0.2.2 instead of 127.0.0.1</Text>
                <Text>• Update config.ts RPC URL</Text>
                <Text className="mt-2 font-semibold">
                  If using Physical Device:
                </Text>
                <Text>• Use your computer's IP address</Text>
                <Text>• Ensure same WiFi network</Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
