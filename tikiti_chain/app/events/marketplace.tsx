/**
 * Marketplace screen for browsing ticket resale listings
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMarketplaceListings } from "@/hooks/marketplace/useTicketListings";
import { usePurchaseListedTicket } from "@/hooks/marketplace/usePurchaseListedTicket";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";
import { useAuthContext } from "@/hooks/auth/use-auth-context";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import type { MarketplaceListing } from "@/types/ticketListing";

export default function MarketplaceScreen() {
  const router = useRouter();
  const { session } = useAuthContext();
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">(
    "newest",
  );
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );

  const {
    data: listings = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMarketplaceListings({
    sortBy,
    category: selectedCategory,
  });

  const purchaseTicket = usePurchaseListedTicket();

  const handlePurchase = async (listing: MarketplaceListing) => {
    if (!session) {
      Alert.alert("Not Authenticated", "Please sign in to purchase tickets");
      return;
    }

    // Check if user has a wallet
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("wallet_address")
      .eq("user_id", session.user.id)
      .eq("is_primary", true)
      .single();

    if (!wallet) {
      Alert.alert(
        "Wallet Required",
        "You need to set up a wallet to purchase tickets. Go to your profile to enable blockchain features.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Go to Profile",
            onPress: () => router.push("/profile"),
          },
        ],
      );
      return;
    }

    // Confirm purchase
    Alert.alert(
      "Confirm Purchase",
      `Purchase ticket for ${listing.event_title}?\n\nPrice: ${listing.listing_price.toFixed(4)} MATIC\n\n${
        listing.royalty_percent
          ? `Includes ${listing.royalty_percent / 100}% organizer royalty`
          : ""
      }`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Purchase",
          onPress: async () => {
            try {
              await purchaseTicket.mutateAsync({
                listing,
                buyerUserId: session.user.id,
                buyerWalletAddress: wallet.wallet_address,
              });
            } catch (error) {
              console.error("Purchase error:", error);
            }
          },
        },
      ],
    );
  };

  const categories = ["Music", "Sports", "Arts", "Technology", "Food", "Other"];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-3xl font-bold mb-1">Ticket Marketplace</Text>
        <Text className="text-sm text-gray-600">
          Buy tickets from other attendees
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Filters Section */}
        <View className="bg-white px-6 py-4 mb-2">
          {/* Category Filter */}
          <Text className="text-sm font-semibold mb-2">Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                !selectedCategory ? "bg-primary-black" : "bg-gray-200"
              }`}
              onPress={() => setSelectedCategory(undefined)}
            >
              <Text
                className={`text-sm font-medium ${
                  !selectedCategory ? "text-white" : "text-gray-700"
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedCategory === category
                    ? "bg-primary-black"
                    : "bg-gray-200"
                }`}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategory === category
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Filter */}
          <Text className="text-sm font-semibold mb-2">Sort By</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                sortBy === "newest" ? "bg-primary-black" : "bg-gray-200"
              }`}
              onPress={() => setSortBy("newest")}
            >
              <Text
                className={`text-sm font-medium ${
                  sortBy === "newest" ? "text-white" : "text-gray-700"
                }`}
              >
                Newest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                sortBy === "price_asc" ? "bg-primary-black" : "bg-gray-200"
              }`}
              onPress={() => setSortBy("price_asc")}
            >
              <Text
                className={`text-sm font-medium ${
                  sortBy === "price_asc" ? "text-white" : "text-gray-700"
                }`}
              >
                Price: Low to High
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${
                sortBy === "price_desc" ? "bg-primary-black" : "bg-gray-200"
              }`}
              onPress={() => setSortBy("price_desc")}
            >
              <Text
                className={`text-sm font-medium ${
                  sortBy === "price_desc" ? "text-white" : "text-gray-700"
                }`}
              >
                Price: High to Low
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Listings */}
        <View className="px-6 py-4">
          {isLoading ? (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-gray-600 mt-4">Loading listings...</Text>
            </View>
          ) : isError ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-red-600 text-center">
                Failed to load listings
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-black px-6 py-3 rounded-xl"
                onPress={() => refetch()}
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : listings.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-6xl mb-4">🎫</Text>
              <Text className="text-xl font-semibold text-gray-800 mb-2">
                No Listings Available
              </Text>
              <Text className="text-sm text-gray-600 text-center px-8">
                There are no tickets listed for resale at the moment. Check back
                later!
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-sm text-gray-600 mb-4">
                {listings.length} {listings.length === 1 ? "ticket" : "tickets"}{" "}
                available
              </Text>
              {listings.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  onPress={() => {
                    // Navigate to event details or listing details
                    router.push(`/events/${listing.event_id}`);
                  }}
                  onPurchase={() => handlePurchase(listing)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Loading Overlay for Purchase */}
      {purchaseTicket.isPending && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className="bg-white p-6 rounded-2xl items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-lg font-semibold mt-4">
              Processing Purchase...
            </Text>
            <Text className="text-sm text-gray-600 mt-2 text-center">
              Please wait while we complete the transaction
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
