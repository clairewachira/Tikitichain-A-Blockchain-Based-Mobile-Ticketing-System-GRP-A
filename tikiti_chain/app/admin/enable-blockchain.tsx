import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useEvents } from "@/hooks/events/useEvents";
import { useCreateBlockchainEvent } from "@/hooks/blockchain/useBlockchainEvents";
import { useSafeRouter } from "@/hooks/navigation/router";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Event } from "@/types/event";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function EnableBlockchain() {
  return (
    <RoleGuard allowedRoles={["organizer", "admin"]}>
      <EnableBlockchainScreen />
    </RoleGuard>
  );
}

function EnableBlockchainScreen() {
  const router = useSafeRouter();
  const { data: eventsData } = useEvents();
  const events = eventsData || [];
  const createBlockchainEvent = useCreateBlockchainEvent();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [totalSupply, setTotalSupply] = useState("100");
  const [royaltyPercent, setRoyaltyPercent] = useState("500"); // 5%
  const [maxResalePrice, setMaxResalePrice] = useState("0.05");
  const [resaleAllowed, setResaleAllowed] = useState(true);

  const handleEnableBlockchain = async () => {
    if (!selectedEvent) {
      Alert.alert("Error", "Please select an event");
      return;
    }

    if (!selectedEvent.time) {
      Alert.alert("Error", "Event must have a date/time");
      return;
    }

    try {
      await createBlockchainEvent.mutateAsync({
        eventId: selectedEvent.id,
        priceInEth: selectedEvent.price.toString(),
        totalSupply: parseInt(totalSupply),
        eventDate: new Date(selectedEvent.time),
        royaltyPercent: parseInt(royaltyPercent),
        maxResalePriceInEth: maxResalePrice,
        resaleAllowed,
      });

      Alert.alert(
        "Success!",
        `Blockchain enabled for "${selectedEvent.title}". Users can now mint NFT tickets!`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      console.error("Enable blockchain error:", error);

      // Check if it's a wallet-related error
      if (error.message?.includes("No wallet found") || error.message?.includes("wallet not found")) {
        Alert.alert(
          "Wallet Required",
          "You need to set up a wallet before creating blockchain events.",
          [
            {
              text: "Set Up Wallet",
              onPress: () => router.push("/(tabs)/profile/wallet-setup"),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(
          "Failed to Enable Blockchain",
          error.message || "An error occurred while enabling blockchain for this event."
        );
      }
    }
  };

  // Filter out events that are already blockchain-enabled
  const availableEvents = events.filter((e) => !e.blockchain_enabled);

  return (
    <SafeAreaView className="flex-1 bg-primary-light_gray">
      <ScrollView className="flex-1 px-4 py-6">
        <View className="gap-6">
          {/* Header */}
          <View className="flex-row items-center gap-4">
            <ContainerIcon
              icon="arrow-back"
              iconType="Ionicons"
              className="p-2 bg-black"
              iconColor={colors.primary.white}
              handleClick={router.back}
            />
            <Text variant="subheading" className="text-3xl flex-1">
              Enable Blockchain
            </Text>
          </View>

          {/* Info Card */}
          <View className="bg-purple-100 border border-purple-300 rounded-xl p-4 gap-2">
            <Text variant="interBold" className="text-lg">
              🔗 Blockchain NFT Tickets
            </Text>
            <Text variant="interMedium" className="text-sm">
              Enable blockchain for your event to offer NFT tickets. These
              tickets are:
            </Text>
            <Text variant="interMedium" className="text-sm">
              • Verifiable and fraud-proof
            </Text>
            <Text variant="interMedium" className="text-sm">
              • Transferable between users
            </Text>
            <Text variant="interMedium" className="text-sm">
              • Collectible digital assets
            </Text>
            <Text variant="interMedium" className="text-sm">
              • Earn royalties on resales
            </Text>
          </View>

          {/* Event Selection */}
          <View className="gap-3">
            <Text variant="interBold" className="text-xl">
              Select Event
            </Text>
            {availableEvents.length === 0 ? (
              <View className="bg-gray-100 rounded-xl p-6 items-center">
                <Text variant="interMedium" className="text-center">
                  No events available. All your events are already
                  blockchain-enabled or create a new event first.
                </Text>
              </View>
            ) : (
              availableEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  className={`border-2 rounded-xl p-4 ${
                    selectedEvent?.id === event.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-300 bg-white"
                  }`}
                  onPress={() => setSelectedEvent(event)}
                >
                  <Text variant="interBold" className="text-lg">
                    {event.title}
                  </Text>
                  <Text variant="interMedium" className="text-sm text-gray-600">
                    {event.category} • {event.price} POL
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {selectedEvent && (
            <>
              {/* Configuration */}
              <View className="gap-4">
                <Text variant="interBold" className="text-xl">
                  Blockchain Settings
                </Text>

                {/* Total Supply */}
                <View className="gap-2">
                  <Text variant="interBold">Total Ticket Supply</Text>
                  <TextInput
                    className="border border-black rounded-xl p-4 text-lg text-black"
                    value={totalSupply}
                    onChangeText={setTotalSupply}
                    keyboardType="number-pad"
                    placeholder="100"
                  />
                  <Text variant="interMedium" className="text-sm text-gray-600">
                    Maximum number of NFT tickets available
                  </Text>
                </View>

                {/* Royalty Percent */}
                <View className="gap-2">
                  <Text variant="interBold">Royalty Percentage</Text>
                  <TextInput
                    className="border border-black rounded-xl p-4 text-lg text-black"
                    value={royaltyPercent}
                    onChangeText={setRoyaltyPercent}
                    keyboardType="number-pad"
                    placeholder="500"
                  />
                  <Text variant="interMedium" className="text-sm text-gray-600">
                    In basis points (500 = 5%). You earn this on every resale.
                  </Text>
                </View>

                {/* Max Resale Price */}
                <View className="gap-2">
                  <Text variant="interBold">Max Resale Price (POL)</Text>
                  <TextInput
                    className="border border-black rounded-xl p-4 text-lg text-black"
                    value={maxResalePrice}
                    onChangeText={setMaxResalePrice}
                    keyboardType="decimal-pad"
                    placeholder="0.05"
                  />
                  <Text variant="interMedium" className="text-sm text-gray-600">
                    Maximum price for ticket resales (0 = no limit)
                  </Text>
                </View>

                {/* Resale Allowed */}
                <TouchableOpacity
                  className="flex-row items-center gap-3 p-4 border border-black rounded-xl"
                  onPress={() => setResaleAllowed(!resaleAllowed)}
                >
                  <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center ${
                      resaleAllowed
                        ? "bg-primary-black border-primary-black"
                        : "border-primary-dark_gray"
                    }`}
                  >
                    {resaleAllowed && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text variant="interBold">Allow Ticket Resale</Text>
                    <Text
                      variant="interMedium"
                      className="text-sm text-gray-600"
                    >
                      Users can transfer/resell tickets
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Summary */}
              <View className="bg-primary-light_gray rounded-xl p-4 gap-2">
                <Text variant="interBold" className="text-lg">
                  Summary
                </Text>
                <Text variant="interMedium">Event: {selectedEvent.title}</Text>
                <Text variant="interMedium">
                  Ticket Price: {selectedEvent.price} POL
                </Text>
                <Text variant="interMedium">
                  Total Supply: {totalSupply} tickets
                </Text>
                <Text variant="interMedium">
                  Your Royalty: {parseInt(royaltyPercent) / 100}% on resales
                </Text>
              </View>

              {/* Enable Button */}
              <Button
                name={
                  createBlockchainEvent.isPending
                    ? "Enabling Blockchain..."
                    : "Enable Blockchain for Event"
                }
                className="bg-primary-black py-5 rounded-full mt-4"
                textClassName="text-xl text-white"
                onPress={handleEnableBlockchain}
                disabled={createBlockchainEvent.isPending}
              />

              {createBlockchainEvent.isPending && (
                <View className="items-center py-4">
                  <ActivityIndicator
                    size="large"
                    color={colors.secondary.blue}
                  />
                  <Text variant="interMedium" className="text-sm mt-2">
                    Creating blockchain event... This may take a few seconds.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
