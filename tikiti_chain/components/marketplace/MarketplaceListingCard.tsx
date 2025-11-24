/**
 * Card component for displaying a marketplace listing
 */

import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import type { MarketplaceListing } from "@/types/ticketListing";

type MarketplaceListingCardProps = {
  listing: MarketplaceListing;
  onPress: () => void;
  onPurchase?: () => void;
};

export const MarketplaceListingCard: React.FC<MarketplaceListingCardProps> = ({
  listing,
  onPress,
  onPurchase,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPriceBadgeColor = () => {
    switch (listing.price_status) {
      case "below":
        return "bg-green-100 text-green-700";
      case "above":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriceBadgeText = () => {
    const diff = Math.abs(listing.price_difference);
    const percentage = ((diff / listing.original_price) * 100).toFixed(0);

    switch (listing.price_status) {
      case "below":
        return `${percentage}% below`;
      case "above":
        return `${percentage}% above`;
      default:
        return "Face value";
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-4 overflow-hidden"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Event Image */}
      {listing.event_gallery && listing.event_gallery.length > 0 && (
        <Image
          source={{ uri: listing.event_gallery[0] }}
          className="w-full h-48"
          resizeMode="cover"
        />
      )}

      <View className="p-4">
        {/* Event Title */}
        <Text className="text-lg font-bold mb-2" numberOfLines={2}>
          {listing.event_title}
        </Text>

        {/* Event Date & Time */}
        <View className="flex-row items-center mb-3">
          <Text className="text-sm text-gray-600">
            📅 {formatDate(listing.event_time)}
          </Text>
          {listing.event_time && (
            <Text className="text-sm text-gray-600 ml-2">
              🕐 {formatTime(listing.event_time)}
            </Text>
          )}
        </View>

        {/* Category Badge */}
        <View className="mb-3">
          <View className="self-start bg-primary-light_gray px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-primary-black">
              {listing.event_category}
            </Text>
          </View>
        </View>

        {/* Pricing Section */}
        <View className="border-t border-gray-200 pt-3">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-xs text-gray-500 mb-1">Listing Price</Text>
              <Text className="text-2xl font-bold text-primary-black">
                {listing.listing_price.toFixed(4)} MATIC
              </Text>
            </View>

            <View className={`px-3 py-1 rounded-full ${getPriceBadgeColor()}`}>
              <Text className="text-xs font-semibold">
                {getPriceBadgeText()}
              </Text>
            </View>
          </View>

          {/* Original Price */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xs text-gray-500">
              Original: {listing.original_price.toFixed(4)} MATIC
            </Text>
            <Text className="text-xs text-gray-500">
              Listed {new Date(listing.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* Royalty Info */}
          {listing.royalty_percent && listing.royalty_percent > 0 && (
            <View className="p-2 rounded-lg mb-3">
              <Text className="text-xs text-gray-700">
                {listing.royalty_percent / 100}% royalty to organizer
              </Text>
            </View>
          )}

          {/* Purchase Button */}
          {onPurchase && (
            <TouchableOpacity
              className="bg-primary-black py-3 rounded-xl"
              onPress={(e) => {
                e.stopPropagation();
                onPurchase();
              }}
              activeOpacity={0.8}
            >
              <Text className="text-center font-semibold text-white">
                Purchase Ticket
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
