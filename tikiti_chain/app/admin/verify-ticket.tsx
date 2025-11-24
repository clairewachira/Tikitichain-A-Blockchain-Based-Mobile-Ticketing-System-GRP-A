import { useState, useEffect } from "react";
import {
  View,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { CameraView, Camera } from "expo-camera";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase";
import { formatTime } from "@/utils/functions";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function VerifyTicket() {
  return (
    <RoleGuard allowedRoles={["organizer", "admin"]}>
      <VerifyTicketScreen />
    </RoleGuard>
  );
}

function VerifyTicketScreen() {
  const router = useSafeRouter();
  const queryClient = useQueryClient();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [scanning, setScanning] = useState(true);

  // Request camera permission on mount
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  // Fetch ticket details
  const { data: ticket, isLoading: isLoadingTicket } = useQuery({
    queryKey: ["verifyTicket", ticketData?.ticketId],
    queryFn: async () => {
      if (!ticketData?.ticketId) return null;
      const { data, error } = await supabase
        .from("user_blockchain_tickets_view")
        .select("*")
        .eq("id", ticketData.ticketId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!ticketData?.ticketId,
  });

  // Redeem ticket mutation
  const redeemTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("blockchain_tickets")
        .update({
          is_redeemed: true,
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifyTicket"] });
      Alert.alert("Success", "Ticket has been redeemed successfully!", [
        {
          text: "Scan Another",
          onPress: () => {
            setScanned(false);
            setTicketData(null);
            setScanning(true);
          },
        },
        {
          text: "Done",
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to redeem ticket");
    },
  });

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true);
    setScanning(false);
    try {
      const parsedData = JSON.parse(data);
      setTicketData(parsedData);
    } catch (error) {
      Alert.alert("Error", "Invalid QR code", [
        {
          text: "Try Again",
          onPress: () => {
            setScanned(false);
            setScanning(true);
          },
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView className="flex-1 bg-primary-light_gray items-center justify-center px-4 gap-6">
        <ContainerIcon
          icon="qrcode-scan"
          iconType="MaterialCommunityIcons"
          className="bg-black p-6"
          iconColor={colors.primary.white}
          iconSize={60}
          interactive={false}
        />
        <Text variant="interBold" className="text-2xl text-center">
          Camera Permission Required
        </Text>
        <Text variant="interMedium" className="text-center text-gray-600">
          We need camera access to scan QR codes on tickets
        </Text>
        <Button
          name="Grant Permission"
          className="bg-black px-12 py-4 rounded-full"
          onPress={requestPermission}
        />
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView className="flex-1 bg-primary-light_gray items-center justify-center px-4 gap-6">
        <Text variant="interBold" className="text-2xl text-center">
          Camera Access Denied
        </Text>
        <Text variant="interMedium" className="text-center text-gray-600">
          Please enable camera access in your device settings to scan tickets
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
    <SafeAreaView className="flex-1 bg-primary-light_gray">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-4 pt-4 pb-2 gap-3">
        <ContainerIcon
          icon="arrow-back"
          iconType="Ionicons"
          iconColor={colors.primary.light_gray}
          className="p-2 bg-black self-start"
          handleClick={router.back}
        />
        <Text variant="subheading" className="text-3xl">
          Verify Ticket
        </Text>
        <Text variant="interMedium" className="text-gray-600">
          Scan the QR code on the attendee's ticket
        </Text>
      </View>

      {scanning && (
        <View className="flex-1 m-4 rounded-3xl overflow-hidden">
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={{ flex: 1 }}
          />
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-64 h-64 border-4 border-white rounded-3xl" />
          </View>
        </View>
      )}

      {ticketData && ticket && (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {isLoadingTicket ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.primary.black} />
            </View>
          ) : (
            <View className="bg-white rounded-3xl p-6 gap-6 mb-6">
              {/* Ticket Status Badge */}
              <View
                className={`p-4 rounded-2xl items-center ${
                  ticket.is_redeemed
                    ? "bg-red-50 border-2 border-red-300"
                    : "bg-green-50 border-2 border-green-300"
                }`}
              >
                <ContainerIcon
                  icon={
                    ticket.is_redeemed ? "close-circle" : "checkmark-circle"
                  }
                  iconType="Ionicons"
                  className={
                    ticket.is_redeemed ? "bg-red-500 p-3" : "bg-green-500 p-3"
                  }
                  iconColor={colors.primary.white}
                  iconSize={40}
                  interactive={false}
                />
                <Text
                  variant="interBold"
                  className={`text-2xl mt-3 ${
                    ticket.is_redeemed ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {ticket.is_redeemed ? "Already Redeemed" : "Valid Ticket"}
                </Text>
                {ticket.is_redeemed && ticket.redeemed_at && (
                  <Text
                    variant="interMedium"
                    className="text-sm text-gray-600 mt-1"
                  >
                    Redeemed on {new Date(ticket.redeemed_at).toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Event Image */}
              {ticket.gallery?.[0] && (
                <Image
                  source={{ uri: ticket.gallery[0] }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
              )}

              {/* Event Details */}
              <View className="gap-4">
                <View>
                  <Text variant="interBold" className="text-2xl">
                    {ticket.event_title}
                  </Text>
                  <Text variant="interMedium" className="text-gray-600 mt-1">
                    {formatTime(ticket.event_time, { fullMonth: true })} at{" "}
                    {formatTime(ticket.event_time, { onlyTime: true })}
                  </Text>
                </View>

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
                      Owner Address
                    </Text>
                    <Text variant="interBold" className="text-xs">
                      {ticket.owner_wallet_address.slice(0, 8)}...
                      {ticket.owner_wallet_address.slice(-6)}
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
                </View>
              </View>

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                {!ticket.is_redeemed && (
                  <Button
                    name={
                      redeemTicket.isPending ? "Redeeming..." : "Redeem Ticket"
                    }
                    className="bg-green-600 w-full py-4 rounded-full"
                    disabled={redeemTicket.isPending}
                    onPress={() => {
                      Alert.alert(
                        "Confirm Redemption",
                        "Are you sure you want to mark this ticket as redeemed? This action cannot be undone.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Redeem",
                            style: "destructive",
                            onPress: () => redeemTicket.mutate(ticket.id),
                          },
                        ],
                      );
                    }}
                  />
                )}
                <Button
                  name="Scan Another Ticket"
                  className="bg-black w-full py-4 rounded-full"
                  onPress={() => {
                    setScanned(false);
                    setTicketData(null);
                    setScanning(true);
                  }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
