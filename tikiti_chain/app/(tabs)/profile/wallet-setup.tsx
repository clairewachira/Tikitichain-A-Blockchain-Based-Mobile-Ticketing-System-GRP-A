import { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import ContainerIcon from "@/components/ui/ContainerIcon";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { useGenerateWallet, useUserWallet } from "@/hooks/wallet/useUserWallet";
import { useWalletConnect } from "@/hooks/wallet/useWalletConnect";
import { useRequestTestnetFunds, getFaucetInfo } from "@/hooks/wallet/useFaucet";
import { Toast } from "toastify-react-native";

export default function WalletSetup() {
  const router = useRouter();
  const { data: userWallet, isLoading } = useUserWallet();
  const generateWallet = useGenerateWallet();
  const {
    connectWallet,
    saveWalletAddress,
    isConnected,
    address,
    isConnecting,
    switchNetwork,
    checkNetwork,
  } = useWalletConnect();
  const requestFunds = useRequestTestnetFunds();
  const faucetInfo = getFaucetInfo();
  const [selectedOption, setSelectedOption] = useState<
    "custodial" | "walletconnect" | null
  >(null);

  // Handle WalletConnect connection success
  useEffect(() => {
    if (isConnected && address && selectedOption === "walletconnect") {
      handleWalletConnectSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, selectedOption]);

  const handleWalletConnectSuccess = async () => {
    try {
      // Give provider a moment to fully initialize after connection
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if already on correct network
      const isCorrectNetwork = await checkNetwork();

      if (!isCorrectNetwork) {
        // Try to switch network (will fail on most mobile wallets with helpful instructions)
        try {
          await switchNetwork();
        } catch (switchError: any) {
          // Show the error message which includes instructions
          Toast.error(switchError.message || "Failed to switch network");
          setSelectedOption(null);
          return;
        }
      }

      // Save wallet address to database
      await saveWalletAddress(address!);

      Toast.success("External wallet connected successfully!");
      router.back();
    } catch (error: any) {
      console.error("Error saving wallet:", error);
      Toast.error(error.message || "Failed to save wallet");
      setSelectedOption(null);
    }
  };

  const handleCreateCustodialWallet = async () => {
    try {
      setSelectedOption("custodial");
      const result = await generateWallet.mutateAsync();

      if (result.exists) {
        Toast.info("You already have a wallet!");
      } else {
        Toast.success("Wallet created successfully!");
      }

      router.back();
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      Toast.error(error.message || "Failed to create wallet");
      setSelectedOption(null);
    }
  };

  const handleConnectExternalWallet = async () => {
    try {
      setSelectedOption("walletconnect");
      await connectWallet();
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      Toast.error(error.message || "Failed to connect wallet");
      setSelectedOption(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-white items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary.black} />
      </SafeAreaView>
    );
  }

  // If user already has a wallet, show wallet info
  if (userWallet) {
    return (
      <SafeAreaView className="flex-1 bg-primary-white">
        <StatusBar
          backgroundColor={colors.primary.white}
          barStyle={"dark-content"}
        />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-6 gap-6"
        >
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 bg-primary-light_gray rounded-full"
            >
              <ContainerIcon
                icon="chevron-back"
                iconType="Ionicons"
                iconSize={24}
                interactive={false}
              />
            </TouchableOpacity>
            <Text variant="interBold" className="text-2xl">
              Your Wallet
            </Text>
          </View>

          {/* Wallet Info */}
          <View className="border-2 border-black rounded-2xl p-4 gap-4">
            <View className="flex-row items-center gap-3">
              <ContainerIcon
                icon={
                  userWallet.wallet_type === "custodial"
                    ? "wallet-outline"
                    : "link-outline"
                }
                iconType="Ionicons"
                className="bg-primary-black p-3"
                iconColor={colors.primary.white}
                iconSize={24}
                interactive={false}
              />
              <View className="flex-1">
                <Text variant="interBold" className="text-lg">
                  {userWallet.wallet_type === "custodial"
                    ? "Quick Wallet"
                    : "Connected Wallet"}
                </Text>
                <Text variant="interMedium" className="text-xs text-gray-600">
                  {userWallet.wallet_type === "custodial"
                    ? "App-managed wallet"
                    : "External wallet"}
                </Text>
              </View>
            </View>

            <View className="bg-primary-light_gray p-3 rounded-xl">
              <Text variant="interMedium" className="text-xs text-gray-600 mb-1">
                Wallet Address
              </Text>
              <Text variant="interBold" className="text-sm" numberOfLines={1}>
                {userWallet.wallet_address}
              </Text>
            </View>

            {userWallet.wallet_type === "custodial" && (
              <View className="bg-yellow-50 border border-yellow-300 p-3 rounded-xl">
                <Text variant="interBold" className="text-xs text-yellow-800 mb-1">
                  ⚠️ Security Notice
                </Text>
                <Text
                  variant="interMedium"
                  className="text-xs text-yellow-700"
                >
                  This is a custodial wallet managed by the app. For maximum
                  security, consider connecting an external wallet like MetaMask.
                </Text>
              </View>
            )}
          </View>

          {/* Faucet Button (for testnet) */}
          {faucetInfo.available && (
            <View className="gap-3">
              <Text variant="interBold" className="text-lg">
                Need Test MATIC?
              </Text>
              <TouchableOpacity
                className="bg-blue-500 border-2 border-blue-700 rounded-xl p-4 flex-row items-center gap-3"
                onPress={() => requestFunds.mutate()}
                disabled={requestFunds.isPending}
              >
                <ContainerIcon
                  icon="water-outline"
                  iconType="Ionicons"
                  className="bg-blue-600 p-2"
                  iconColor={colors.primary.white}
                  iconSize={24}
                  interactive={false}
                />
                <View className="flex-1">
                  <Text variant="interBold" className="text-white">
                    Get Free Testnet MATIC
                  </Text>
                  <Text variant="interMedium" className="text-xs text-blue-100">
                    {faucetInfo.instructions}
                  </Text>
                </View>
                {requestFunds.isPending && (
                  <ActivityIndicator size="small" color={colors.primary.white} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          {userWallet.wallet_type === "custodial" && (
            <View className="gap-3">
              <Text variant="interBold" className="text-lg">
                Want More Control?
              </Text>
              <TouchableOpacity
                className="border-2 border-black rounded-xl p-4 flex-row items-center gap-3"
                onPress={handleConnectExternalWallet}
                disabled={isConnecting}
              >
                <ContainerIcon
                  icon="link-outline"
                  iconType="Ionicons"
                  className="bg-primary-light_gray p-2"
                  iconSize={24}
                  interactive={false}
                />
                <View className="flex-1">
                  <Text variant="interBold">Connect External Wallet</Text>
                  <Text variant="interMedium" className="text-xs text-gray-600">
                    Use MetaMask, Trust Wallet, or other Web3 wallets
                  </Text>
                </View>
                {isConnecting && (
                  <ActivityIndicator size="small" color={colors.primary.black} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show wallet setup options
  return (
    <SafeAreaView className="flex-1 bg-primary-white">
      <StatusBar
        backgroundColor={colors.primary.white}
        barStyle={"dark-content"}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-6"
      >
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 bg-primary-light_gray rounded-full"
          >
            <ContainerIcon
              icon="chevron-back"
              iconType="Ionicons"
              iconSize={24}
              interactive={false}
            />
          </TouchableOpacity>
          <Text variant="interBold" className="text-2xl">
            Setup Your Wallet
          </Text>
        </View>

        {/* Info */}
        <View className="bg-primary-light_gray p-4 rounded-xl">
          <Text variant="interBold" className="text-base mb-2">
            🎫 Why do I need a wallet?
          </Text>
          <Text variant="interMedium" className="text-sm text-gray-700">
            Your wallet securely stores blockchain event tickets as NFTs. Choose
            the option that works best for you:
          </Text>
        </View>

        {/* Option 1: Quick Wallet */}
        <TouchableOpacity
          className="border-2 border-black rounded-2xl p-5 gap-4"
          onPress={handleCreateCustodialWallet}
          disabled={generateWallet.isPending || isConnecting}
        >
          <View className="flex-row items-start gap-3">
            <ContainerIcon
              icon="flash-outline"
              iconType="Ionicons"
              className="bg-black p-3"
              iconColor={colors.primary.white}
              iconSize={24}
              interactive={false}
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text variant="interBold" className="text-lg">
                  Quick Wallet
                </Text>
                <View className="bg-green-100 px-2 py-0.5 rounded-full">
                  <Text variant="interBold" className="text-green-700 text-xs">
                    RECOMMENDED
                  </Text>
                </View>
              </View>
              <Text variant="interMedium" className="text-sm text-gray-600 mb-3">
                Perfect for beginners. We'll create and manage a wallet for you.
              </Text>

              {/* Pros */}
              <View className="gap-2">
                <View className="flex-row items-start gap-2">
                  <Text className="text-green-600 text-lg">✓</Text>
                  <Text variant="interMedium" className="text-xs flex-1">
                    Instant setup - no installations needed
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-green-600 text-lg">✓</Text>
                  <Text variant="interMedium" className="text-xs flex-1">
                    No seed phrases to manage
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-green-600 text-lg">✓</Text>
                  <Text variant="interMedium" className="text-xs flex-1">
                    Works on all devices automatically
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {generateWallet.isPending && selectedOption === "custodial" && (
            <View className="items-center">
              <ActivityIndicator size="small" color={colors.primary.black} />
            </View>
          )}
        </TouchableOpacity>

        {/* Option 2: External Wallet */}
        <TouchableOpacity
          className="border-2 border-black rounded-2xl p-5 gap-4"
          onPress={handleConnectExternalWallet}
          disabled={generateWallet.isPending || isConnecting}
        >
          <View className="flex-row items-start gap-3">
            <ContainerIcon
              icon="link-outline"
              iconType="Ionicons"
              className="bg-primary-light_gray p-3"
              iconSize={24}
              interactive={false}
            />
            <View className="flex-1">
              <Text variant="interBold" className="text-lg mb-1">
                Connect External Wallet
              </Text>
              <Text variant="interMedium" className="text-sm text-gray-600 mb-3">
                For crypto users. Use MetaMask, Trust Wallet, Rainbow, or others.
              </Text>

              {/* Pros */}
              <View className="gap-2">
                <View className="flex-row items-start gap-2">
                  <Text className="text-blue-600 text-lg">✓</Text>
                  <Text variant="interMedium" className="text-xs flex-1">
                    You control your private keys
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-blue-600 text-lg">✓</Text>
                  <Text variant="interMedium" className="text-xs flex-1">
                    Use existing wallet with funds
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <Text className="text-blue-600 text-lg">✓</Text>
                  <Text variant="interMedium" className="text-xs flex-1">
                    Maximum security and decentralization
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Network requirement notice */}
          <View className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <Text variant="interBold" className="text-amber-900 text-xs mb-1">
              Network Requirement
            </Text>
            <Text variant="interMedium" className="text-amber-800 text-xs">
              Please ensure your wallet is set to{" "}
              <Text variant="interBold">Polygon Amoy Testnet</Text> before
              connecting.
            </Text>
          </View>

          {isConnecting && selectedOption === "walletconnect" && (
            <View className="items-center">
              <ActivityIndicator size="small" color={colors.primary.black} />
            </View>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
          <Text variant="interBold" className="text-blue-900 mb-2">
            💡 Need help choosing?
          </Text>
          <Text variant="interMedium" className="text-sm text-blue-800">
            If you&apos;re new to blockchain, choose <Text variant="interBold">Quick Wallet</Text>.
            {"\n\n"}
            If you already have MetaMask or similar wallet apps, choose{" "}
            <Text variant="interBold">Connect External Wallet</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
