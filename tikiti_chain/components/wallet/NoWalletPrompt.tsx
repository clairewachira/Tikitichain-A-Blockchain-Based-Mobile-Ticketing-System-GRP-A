import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/Text";
import ContainerIcon from "@/components/ui/ContainerIcon";
import { colors } from "@/constants/colors";

interface NoWalletPromptProps {
  message?: string;
  showSetupButton?: boolean;
}

/**
 * Component to show when user doesn't have a wallet
 * Provides helpful instructions and optional setup button
 */
export default function NoWalletPrompt({
  message = "You need a wallet to use blockchain features",
  showSetupButton = true,
}: NoWalletPromptProps) {
  const router = useRouter();

  return (
    <View className="items-center justify-center p-6 bg-yellow-50 border-2 border-yellow-300 rounded-2xl m-4">
      <ContainerIcon
        icon="wallet-outline"
        iconType="Ionicons"
        className="bg-yellow-200 p-4 mb-3"
        iconSize={48}
        iconColor={colors.primary.black}
        interactive={false}
      />

      <Text variant="interBold" className="text-lg text-center mb-2">
        Wallet Setup Required
      </Text>

      <Text variant="interMedium" className="text-sm text-center text-gray-700 mb-4">
        {message}
      </Text>

      <View className="bg-white p-3 rounded-xl mb-4 w-full">
        <Text variant="interBold" className="text-xs mb-2">
          Quick Setup:
        </Text>
        <View className="gap-1">
          <Text variant="interMedium" className="text-xs text-gray-600">
            1. Go to Profile tab
          </Text>
          <Text variant="interMedium" className="text-xs text-gray-600">
            2. Tap &quot;My Wallet&quot;
          </Text>
          <Text variant="interMedium" className="text-xs text-gray-600">
            3. Choose wallet type
          </Text>
        </View>
      </View>

      {showSetupButton && (
        <TouchableOpacity
          className="bg-primary-black py-3 px-6 rounded-xl flex-row items-center gap-2"
          onPress={() => router.push("/(tabs)/profile/wallet-setup")}
        >
          <ContainerIcon
            icon="add-circle-outline"
            iconType="Ionicons"
            iconSize={20}
            iconColor={colors.primary.white}
            interactive={false}
          />
          <Text variant="interBold" className="text-white">
            Set Up Wallet Now
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
