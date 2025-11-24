import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useEvent } from "@/hooks/events/useEvents";
import { useSafeRouter } from "@/hooks/navigation/router";
import { formatTime } from "@/utils/functions";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  StatusBar,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePurchaseBlockchainTicket } from "@/hooks/blockchain/useBlockchainEvents";
import { useHasWallet, useGenerateWallet } from "@/hooks/wallet/useUserWallet";
import { useCreateBlockchainEvent } from "@/hooks/blockchain/useBlockchainEvents";

export default function TicketDetails() {
  const router = useSafeRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading: isLoadingEvent, error } = useEvent(id);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  const createEvent = useCreateBlockchainEvent();

  // First, create event in Supabase as usual

  // Then, optionally enable blockchain
  async function createBCEvent() {
    await createEvent.mutateAsync({
      eventId: event.id,
      priceInEth: "0.00001",
      totalSupply: 100,
      eventDate: new Date(event.time),
      royaltyPercent: 500, // 5%
      maxResalePriceInEth: "0.05",
      resaleAllowed: true,
    });
  }
  // Debug logging
  React.useEffect(() => {
    console.log("TicketDetails - ID from params:", id);
    console.log("TicketDetails - Event:", event);
    console.log("TicketDetails - Error:", error);
  }, [id, event, error]);

  // Blockchain hooks (only if blockchain is enabled)
  const { data: hasWallet, isLoading: isCheckingWallet } = useHasWallet();
  const generateWallet = useGenerateWallet();
  const purchaseTicket = usePurchaseBlockchainTicket();

  // Check if event has passed
  const eventHasPassed = event?.time ? new Date(event.time) < new Date() : false;

  // Show loading state
  if (isLoadingEvent) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-primary-light_gray">
        <ActivityIndicator size="large" color={colors.primary.black} />
      </SafeAreaView>
    );
  }

  // Show error if event not found
  if (!event) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-primary-light_gray px-4 gap-4">
        <Text variant="interBold" className="text-xl">
          Event not found
        </Text>
        <Button
          name="Go Back"
          className="bg-black px-12 py-4 rounded-full"
          onPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 items-start bg-primary-light_gray px-4 gap-6 pt-4">
      <StatusBar barStyle={"dark-content"} />
      <View className="gap-3 w-full items-start">
        <ContainerIcon
          icon="arrow-back"
          iconType="Ionicons"
          iconColor={colors.primary.light_gray}
          className="p-2 bg-black"
          handleClick={router.back}
        />
        <ContainerIcon
          icon="cube"
          iconType="Ionicons"
          iconColor={colors.primary.light_gray}
          className="absolute p-2 bg-black right-0"
          handleClick={createBCEvent}
        />
        <Text variant="subheading" className="text-3xl">
          Ticket details
        </Text>
      </View>
      <ScrollView className="p-5 border border-black rounded-xl gap-3">
        <View className="flex-row items-center justify-between">
          <Text
            variant="interBold"
            className="px-4 py-1 bg-black rounded-full text-white text-sm"
          >
            {event?.time && formatTime(event.time, { fullMonth: true })}
          </Text>
          <Text
            variant="interBold"
            className="px-4 py-1 bg-black rounded-full text-white text-sm"
          >
            {event?.time && formatTime(event.time, { onlyTime: true })}
          </Text>
        </View>
        <Text variant="interBold" className="text-2xl">
          Seat ticket - {event?.title}
        </Text>
        <View className="gap-2">
          <Text variant="caption">{event?.location.title}</Text>
          <MapView
            style={{ width: "100%", height: 208 }}
            provider={PROVIDER_GOOGLE}
            region={{
              longitude: event?.location?.longitude ?? 36.8219,
              latitude: event?.location?.latitude ?? -1.291,
              longitudeDelta: 0.05,
              latitudeDelta: 0.05,
            }}
          />
        </View>
        <View className="items-center flex-row justify-between">
          <Text variant="interExtraBold" className="text-lg">
            Number of tickets
          </Text>
          <View className="flex-row items-center gap-4">
            <ContainerIcon
              icon="minus"
              iconType="MaterialCommunityIcons"
              className="bg-black p-2"
              iconColor={colors.primary.white}
              iconSize={20}
              handleClick={() =>
                setTicketQuantity(Math.max(1, ticketQuantity - 1))
              }
            />
            <Text variant="interBold" className="text-xl">
              {ticketQuantity}
            </Text>
            <ContainerIcon
              icon="add"
              iconType="Ionicons"
              className="bg-black p-2"
              iconColor={colors.primary.white}
              iconSize={20}
              handleClick={() =>
                setTicketQuantity(Math.min(10, ticketQuantity + 1))
              }
            />
          </View>
        </View>
      </ScrollView>
      <View className="gap-2 w-full">
        <View className="flex-row items-center justify-between">
          <Text variant="interMedium" className="text-sm">
            Ticket x{ticketQuantity}
          </Text>
          <Text variant="interMedium" className="text-sm">
            {((event?.price || 0) * ticketQuantity).toFixed(4)} POL
          </Text>
        </View>
        {event?.blockchain_enabled && (
          <View className="flex-row items-center justify-between">
            <Text variant="interMedium" className="text-sm">
              Gas fee (estimated)
            </Text>
            <Text variant="interMedium" className="text-sm">
              ~0.001 POL
            </Text>
          </View>
        )}
        <View className="flex-row items-center justify-between">
          <Text variant="interMedium" className="text-sm">
            Service fee
          </Text>
          <Text variant="interMedium" className="text-sm">
            {((event?.price || 0) * ticketQuantity * 0.025).toFixed(4)} POL
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text variant="interMedium" className="text-sm">
            Total price
          </Text>
          <Text variant="interExtraBold" className="text-lg">
            {(
              (event?.price || 0) * ticketQuantity * 1.025 +
              (event?.blockchain_enabled ? 0.001 : 0)
            ).toFixed(4)}{" "}
            POL
          </Text>
        </View>
      </View>

      {/* Event passed indicator */}
      {eventHasPassed && (
        <View className="w-full bg-red-100 border border-red-300 rounded-xl p-4 flex-row items-center gap-3">
          <ContainerIcon
            icon="time-outline"
            iconType="Ionicons"
            className="bg-red-600 p-2"
            iconColor={colors.primary.white}
            iconSize={20}
            interactive={false}
          />
          <View className="flex-1">
            <Text variant="interBold" className="text-sm text-red-900">
              Event Has Passed
            </Text>
            <Text variant="interMedium" className="text-xs text-red-700">
              This event has already occurred. Tickets are no longer available for purchase.
            </Text>
          </View>
        </View>
      )}

      {/* Blockchain indicator */}
      {event?.blockchain_enabled && !eventHasPassed && (
        <View className="w-full bg-purple-100 border border-purple-300 rounded-xl p-4 flex-row items-center gap-3">
          <ContainerIcon
            icon="shield-checkmark"
            iconType="Ionicons"
            className="bg-purple-600 p-2"
            iconColor={colors.primary.white}
            iconSize={20}
            interactive={false}
          />
          <View className="flex-1">
            <Text variant="interBold" className="text-sm">
              NFT Ticket
            </Text>
            <Text variant="interMedium" className="text-xs text-gray-600">
              Secured on blockchain • Transferable • Verifiable
            </Text>
          </View>
        </View>
      )}

      {!hasWallet && event?.blockchain_enabled && !isCheckingWallet && !eventHasPassed && (
        <View className="w-full gap-3">
          <TouchableOpacity
            className="border-2 border-purple-600 py-4 w-full items-center rounded-xl bg-purple-50"
            onPress={() => router.push("/(tabs)/profile/wallet-setup")}
          >
            <Text
              variant="interExtraBold"
              className="text-lg text-purple-600"
            >
              Set Up Wallet to Continue
            </Text>
            <Text
              variant="interMedium"
              className="text-xs text-gray-600 mt-1"
            >
              Required for NFT tickets • Choose Quick Wallet or connect external
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Button
        name={
          eventHasPassed
            ? "Event Has Passed"
            : purchaseTicket.isPending
              ? "Processing..."
              : event?.blockchain_enabled
                ? "Mint NFT Ticket"
                : "Continue"
        }
        className={`w-[80%] absolute self-center py-5 rounded-full ${
          eventHasPassed ? "bg-gray-400" : "bg-black"
        }`}
        bottom={24}
        textClassName="text-xl"
        disabled={
          eventHasPassed ||
          purchaseTicket.isPending ||
          (event?.blockchain_enabled && !hasWallet)
        }
        //onPress={createBCEvent}
        onPress={async () => {
          if (!event) return;

          if (event.blockchain_enabled) {
            // Purchase blockchain ticket
            try {
              await purchaseTicket.mutateAsync({
                eventId: event.id,
                quantity: ticketQuantity,
              });

              Alert.alert(
                "Success!",
                `${ticketQuantity} NFT ticket(s) purchased successfully!`,
                [
                  {
                    text: "View Tickets",
                    onPress: () => router.push("/(tabs)/profile"),
                  },
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ],
              );
            } catch (error: any) {
              console.error("Purchase error:", error);

              // Check if it's a wallet-related error
              if (error.message?.includes("No wallet found") || error.message?.includes("wallet not found")) {
                Alert.alert(
                  "Wallet Required",
                  "Please set up your wallet first to purchase NFT tickets.",
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
                  "Purchase Failed",
                  error.message || "Failed to purchase ticket. Please try again.",
                );
              }
            }
          } else {
            // Regular ticket purchase flow
            Alert.alert(
              "Coming soon",
              "Traditional ticket purchasing will be available soon!",
            );
          }
        }}
      />
    </SafeAreaView>
  );
}
