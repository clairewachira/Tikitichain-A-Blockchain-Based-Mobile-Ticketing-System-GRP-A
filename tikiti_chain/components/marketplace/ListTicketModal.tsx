/**
 * Modal for listing a ticket for resale
 */

import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import CustomBottomSheetModal from "@/components/ui/BottomSheet";
import { useCreateTicketListing } from "@/hooks/marketplace/useTicketListings";
import type { Event } from "@/types/event";

type ListTicketModalProps = {
  tokenId: string;
  event: Event;
  originalPrice: number;
  sellerWalletAddress: string;
  onSuccess?: () => void;
};

export type ListTicketModalRef = {
  present: () => void;
  dismiss: () => void;
};

export const ListTicketModal = forwardRef<
  ListTicketModalRef,
  ListTicketModalProps
>(function ListTicketModal(
  { tokenId, event, originalPrice, sellerWalletAddress, onSuccess },
  ref,
) {
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const [listingPrice, setListingPrice] = useState(originalPrice.toString());
  const [expirationDays, setExpirationDays] = useState("7");
  const createListing = useCreateTicketListing();

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const handleListTicket = async () => {
    const price = parseFloat(listingPrice);

    // Validate price
    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0");
      return;
    }

    // Check max resale price if set
    if (event?.max_resale_price && price > event.max_resale_price) {
      Alert.alert(
        "Price Too High",
        `The maximum resale price for this event is ${event.max_resale_price} MATIC. Please set a lower price.`,
      );
      return;
    }

    // Check if resale is allowed (default to true if not specified)
    if (event?.resale_allowed === false) {
      Alert.alert(
        "Resale Not Allowed",
        "Ticket resale is not permitted for this event.",
      );
      return;
    }

    // Calculate expiration date
    const days = parseInt(expirationDays);
    let expiresAt: string | undefined;
    if (!isNaN(days) && days > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      expiresAt = expirationDate.toISOString();
    }

    try {
      await createListing.mutateAsync({
        token_id: tokenId,
        event_id: event?.id || "",
        seller_wallet_address: sellerWalletAddress,
        listing_price: price,
        original_price: price + 0.01,
        expires_at: expiresAt,
      });

      Alert.alert(
        "Ticket Listed!",
        "Your ticket has been successfully listed on the marketplace.",
      );
      bottomSheetRef.current?.dismiss();
      onSuccess?.();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to list ticket");
    }
  };

  const handleClose = () => {
    bottomSheetRef.current?.dismiss();
  };

  const calculatePriceDifference = () => {
    const price = parseFloat(listingPrice);
    if (isNaN(price)) return null;

    const diff = price - originalPrice;
    const percentage = ((diff / originalPrice) * 100).toFixed(1);

    return { diff, percentage };
  };

  const priceDiff = calculatePriceDifference();

  const calculateSellerEarnings = () => {
    const price = parseFloat(listingPrice);
    if (isNaN(price)) return null;

    // Default to 2.5% (250 basis points) if royalty_percent is not set
    const royaltyPercent = event?.royalty_percent ?? 250;
    const royaltyAmount = (price * royaltyPercent) / 10000;
    const sellerAmount = price - royaltyAmount;

    return { sellerAmount, royaltyAmount };
  };

  const earnings = calculateSellerEarnings();

  return (
    <CustomBottomSheetModal
      ref={bottomSheetRef}
      title="List Ticket for Sale"
      startSnapIndex={7}
      className="px-6 w-full"
      handleCloseModal={handleClose}
    >
      {/* Event Info */}
      <View className="bg-gray-50 p-4 rounded-xl mb-6">
        <Text className="text-lg font-semibold mb-1">
          {event?.title || "Event"}
        </Text>
        <Text className="text-sm text-gray-600">Token ID: {tokenId}</Text>
        <Text className="text-sm text-gray-600">
          Original Price: {originalPrice.toFixed(4)} MATIC
        </Text>
      </View>

      {/* Price Input */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2">
          Listing Price (MATIC)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-4 text-lg"
          placeholder="Enter price in MATIC"
          keyboardType="decimal-pad"
          value={listingPrice}
          onChangeText={setListingPrice}
        />
        {event?.max_resale_price && (
          <Text className="text-xs text-gray-500 mt-1">
            Maximum allowed: {event.max_resale_price} MATIC
          </Text>
        )}
        {priceDiff && (
          <View className="mt-2">
            {priceDiff.diff > 0 ? (
              <Text className="text-sm text-green-600">
                +{priceDiff.diff.toFixed(4)} MATIC (+{priceDiff.percentage}%)
              </Text>
            ) : priceDiff.diff < 0 ? (
              <Text className="text-sm text-red-600">
                {priceDiff.diff.toFixed(4)} MATIC ({priceDiff.percentage}%)
              </Text>
            ) : (
              <Text className="text-sm text-gray-600">
                Same as original price
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Earnings Breakdown */}
      {earnings && (
        <View className="bg-blue-50 p-4 rounded-xl mb-6">
          <Text className="text-base font-semibold mb-3">
            Earnings Breakdown
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-700">Listing Price:</Text>
            <Text className="text-sm font-medium">
              {parseFloat(listingPrice).toFixed(4)} MATIC
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-700">
              Organizer Royalty (
              {((event?.royalty_percent ?? 250) / 100).toFixed(1)}%):
            </Text>
            <Text className="text-sm font-medium text-red-600">
              -{earnings.royaltyAmount.toFixed(4)} MATIC
            </Text>
          </View>
          <View className="border-t border-gray-300 my-2" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold">You'll Receive:</Text>
            <Text className="text-base font-bold text-green-600">
              {earnings.sellerAmount.toFixed(4)} MATIC
            </Text>
          </View>
        </View>
      )}

      {/* Expiration Input */}
      <View className="mb-6">
        <Text className="text-base font-semibold mb-2">
          Listing Duration (Days)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-xl p-4 text-lg"
          placeholder="Enter number of days"
          keyboardType="number-pad"
          value={expirationDays}
          onChangeText={setExpirationDays}
        />
        <Text className="text-xs text-gray-500 mt-1">
          Leave as 0 for no expiration
        </Text>
      </View>

      {/* Important Info */}
      <View className="bg-yellow-50 p-4 rounded-xl mb-6">
        <Text className="text-sm font-semibold mb-2">⚠️ Important</Text>
        <Text className="text-xs text-gray-700 mb-1">
          • Your ticket will be locked and cannot be used until sold or delisted
        </Text>
        <Text className="text-xs text-gray-700 mb-1">
          • The organizer will receive{" "}
          {((event?.royalty_percent ?? 250) / 100).toFixed(1)}% royalty from the
          sale
        </Text>
        <Text className="text-xs text-gray-700">
          • You can cancel this listing at any time before it&apos;s sold
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-gray-200 py-4 rounded-xl"
          onPress={handleClose}
          disabled={createListing.isPending}
        >
          <Text className="text-center font-semibold text-gray-700">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-blue-600 py-4 rounded-xl"
          onPress={handleListTicket}
          disabled={createListing.isPending}
        >
          {createListing.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">
              List Ticket
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </CustomBottomSheetModal>
  );
});
