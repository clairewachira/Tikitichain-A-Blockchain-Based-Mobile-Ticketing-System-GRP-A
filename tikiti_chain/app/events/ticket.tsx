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
  Image,
  ScrollView,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePurchaseBlockchainTicket } from "@/hooks/blockchain/useBlockchainEvents";
import { useHasWallet, useGenerateWallet } from "@/hooks/wallet/useUserWallet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import QRCode from "react-native-qrcode-svg";
import { ListTicketModal, type ListTicketModalRef } from "@/components/marketplace/ListTicketModal";
import { useUserActiveListings } from "@/hooks/marketplace/useTicketListings";

export default function Ticket() {
  const router = useSafeRouter();
  const { id, ticketId } = useLocalSearchParams<{
    id?: string;
    ticketId?: string;
  }>();
  const listModalRef = React.useRef<ListTicketModalRef>(null);

  // Fetch blockchain ticket if ticketId is provided
  const { data: ticket, isLoading: isLoadingTicket } = useQuery({
    queryKey: ["blockchainTicket", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from("user_blockchain_tickets_view")
        .select("*")
        .eq("id", ticketId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });

  const {
    data: event,
    isLoading: isLoadingEvent,
    error,
  } = useEvent(id || ticket?.event_id);
  const [ticketQuantity, setTicketQuantity] = useState(1);

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

  // Fetch user's active listings to check if ticket is already listed
  const { data: listedTickets = [], refetch: refetchListings } = useUserActiveListings();

  // Handler for listing ticket for resale
  const handleResellTicket = () => {
    if (!ticket) {
      return;
    }

    // Check if already listed
    const isListed = listedTickets.some((l) => l.token_id === ticket.token_id);

    if (isListed) {
      Alert.alert('Already Listed', 'This ticket is already listed on the marketplace.');
      return;
    }

    if (ticket.is_redeemed) {
      Alert.alert('Ticket Redeemed', 'This ticket has already been used and cannot be resold.');
      return;
    }

    listModalRef.current?.present();
  };

  // Show loading state
  if (isLoadingEvent || isLoadingTicket) {
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

  // If viewing a purchased ticket (ticketId provided), show NFT ticket view
  if (ticketId && ticket) {
    const qrData = JSON.stringify({
      ticketId: ticket.id,
      tokenId: ticket.token_id,
      eventId: ticket.event_id,
      owner: ticket.owner_wallet_address,
      eventTitle: ticket.event_title,
    });

    return (
      <>
      <ScrollView>
        <SafeAreaView className="flex-1 bg-primary-light_gray px-4 gap-6 pt-4">
          <StatusBar barStyle={"dark-content"} />
          <View className="gap-3 w-full items-start">
            <ContainerIcon
              icon="arrow-back"
              iconType="Ionicons"
              iconColor={colors.primary.light_gray}
              className="p-2 bg-black"
              handleClick={router.back}
            />
            <Text variant="subheading" className="text-3xl">
              Your NFT Ticket
            </Text>
          </View>

          {/* NFT Ticket Card */}
          <View className="bg-white rounded-3xl p-6 gap-6 shadow-lg">
            {/* Ticket Header with Event Image */}
            <View className="gap-4">
              {ticket.gallery?.[0] && (
                <Image
                  source={{ uri: ticket.gallery[0] }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
              )}
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text
                    variant="interBold"
                    className="text-2xl"
                    numberOfLines={2}
                  >
                    {ticket.event_title}
                  </Text>
                  <Text variant="interMedium" className="text-gray-600 mt-1">
                    {formatTime(ticket.event_time, { fullMonth: true })} at{" "}
                    {formatTime(ticket.event_time, { onlyTime: true })}
                  </Text>
                </View>
                {ticket.is_redeemed && (
                  <View className="bg-green-500 px-3 py-1.5 rounded-full">
                    <Text variant="interBold" className="text-white text-xs">
                      REDEEMED
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* QR Code for Verification */}
            <View className="items-center bg-gray-50 rounded-2xl p-6">
              <Text variant="interBold" className="text-lg mb-4">
                Scan to Verify
              </Text>
              <View className="bg-white p-4 rounded-xl">
                <QRCode value={qrData} size={200} />
              </View>
              <Text
                variant="interMedium"
                className="text-xs text-gray-500 mt-4 text-center"
              >
                Organizers can scan this QR code to verify your ticket
              </Text>
            </View>

            {/* Ticket Details */}
            <View className="gap-3 border-t border-gray-200 pt-4">
              <View className="flex-row items-center justify-between">
                <Text variant="interMedium" className="text-gray-600">
                  Token ID
                </Text>
                <Text variant="interBold" className="text-sm">
                  #{ticket.token_id}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text variant="interMedium" className="text-gray-600">
                  Purchase Price
                </Text>
                <Text variant="interBold" className="text-sm">
                  {ticket.purchase_price} POL
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text variant="interMedium" className="text-gray-600">
                  Wallet Address
                </Text>
                <Text variant="interBold" className="text-xs" numberOfLines={1}>
                  {ticket.owner_wallet_address.slice(0, 8)}...
                  {ticket.owner_wallet_address.slice(-6)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text variant="interMedium" className="text-gray-600">
                  Category
                </Text>
                <Text variant="interBold" className="text-sm capitalize">
                  {ticket.category}
                </Text>
              </View>
            </View>

            {/* Blockchain Badge */}
            <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex-row items-center gap-3">
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
                  Secured on Blockchain
                </Text>
                <Text variant="interMedium" className="text-xs text-gray-600">
                  This NFT ticket is verifiable and tamper-proof
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Button
              name="View Event Details"
              className="bg-black w-full py-4 rounded-full"
              onPress={() => router.push(`/events/event?id=${ticket.event_id}`)}
            />
            {!ticket.is_redeemed && (
              <>
                <Button
                  name={listedTickets.some((l) => l.token_id === ticket.token_id) ? "Listed on Marketplace" : "Resell Ticket"}
                  className={`${listedTickets.some((l) => l.token_id === ticket.token_id) ? "bg-green-600" : "bg-white border-2 border-black"} w-full py-4 rounded-full`}
                  textClassName={listedTickets.some((l) => l.token_id === ticket.token_id) ? "text-white" : "text-black"}
                  onPress={handleResellTicket}
                  disabled={listedTickets.some((l) => l.token_id === ticket.token_id)}
                />
                <Button
                  name="Browse Marketplace"
                  className="bg-purple-600 w-full py-4 rounded-full"
                  onPress={() => router.push("/events/marketplace")}
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
      {/* List Ticket Modal */}
      {ticket && (
        <ListTicketModal
          ref={listModalRef}
          tokenId={ticket.token_id}
          event={{
            id: ticket.event_id,
            title: ticket.event_title || 'Event',
            royalty_percent: 250, // Default 2.5% royalty
            resale_allowed: true,
            max_resale_price: undefined,
          } as any}
          originalPrice={ticket.purchase_price}
          sellerWalletAddress={ticket.owner_wallet_address}
          onSuccess={() => {
            // Refetch listings after successfully listing a ticket
            refetchListings();
          }}
        />
      )}
    </>
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
        <Text variant="subheading" className="text-3xl">
          Ticket details
        </Text>
      </View>
      <View className="p-5 border border-black rounded-xl gap-3">
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
      </View>
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

      {/* Blockchain indicator */}
      {event?.blockchain_enabled && (
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

      {!hasWallet && event?.blockchain_enabled && !isCheckingWallet && (
        <TouchableOpacity
          className="border-2 border-purple-600 py-4 w-full items-center rounded-xl bg-purple-50"
          onPress={async () => {
            try {
              await generateWallet.mutateAsync();
              Alert.alert("Success", "Your crypto wallet has been created!");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to create wallet");
            }
          }}
          disabled={generateWallet.isPending}
        >
          {generateWallet.isPending ? (
            <ActivityIndicator color={colors.secondary.blue} />
          ) : (
            <>
              <Text
                variant="interExtraBold"
                className="text-lg text-purple-600"
              >
                Create Wallet to Continue
              </Text>
              <Text
                variant="interMedium"
                className="text-xs text-gray-600 mt-1"
              >
                Required for NFT tickets
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <Button
        name={
          purchaseTicket.isPending
            ? "Processing..."
            : event?.blockchain_enabled
              ? "Mint NFT Ticket"
              : "Continue"
        }
        className="bg-black w-[80%] absolute self-center py-5 rounded-full"
        bottom={24}
        textClassName="text-xl"
        disabled={
          purchaseTicket.isPending || (event?.blockchain_enabled && !hasWallet)
        }
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
              Alert.alert(
                "Error",
                error.message || "Failed to purchase ticket",
              );
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
