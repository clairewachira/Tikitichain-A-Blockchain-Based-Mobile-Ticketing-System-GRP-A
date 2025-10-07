import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { StatusBar, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TicketDetails() {
  const router = useSafeRouter();
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
            07 December
          </Text>
          <Text
            variant="interBold"
            className="px-4 py-1 bg-black rounded-full text-white text-sm"
          >
            19:00
          </Text>
        </View>
        <Text variant="interBold" className="text-2xl">
          Seat ticket - Hanya Yanagihara book presentation
        </Text>
        <View className="gap-2">
          <Text variant="caption">iHub, Westland - James Gichuru</Text>
          <View className="h-52 bg-primary-gray w-full" />
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
            />
            <Text variant="interBold" className="text-xl">
              2
            </Text>
            <ContainerIcon
              icon="add"
              iconType="Ionicons"
              className="bg-black p-2"
              iconColor={colors.primary.white}
              iconSize={20}
            />
          </View>
        </View>
      </View>
      <View className="gap-2 w-full">
        <View className="flex-row items-center justify-between">
          <Text variant="interMedium" className="text-sm">
            Ticket x2
          </Text>
          <Text variant="interMedium" className="text-sm">
            0.1 BTC
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text variant="interMedium" className="text-sm">
            Service fee
          </Text>
          <Text variant="interMedium" className="text-sm">
            0.0125 BTC
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text variant="interMedium" className="text-sm">
            Total price
          </Text>
          <Text variant="interExtraBold" className="text-lg">
            0.1125 BTC
          </Text>
        </View>
      </View>
      <TouchableOpacity className="border border-black py-4 w-full items-center rounded-xl">
        <Text variant="interExtraBold" className="text-lg">
          Etherium Wallet
        </Text>
      </TouchableOpacity>
      <Button
        name="Continue"
        className="bg-black w-[80%] absolute self-center py-5 rounded-full"
        bottom={24}
        textClassName="text-xl"
      />
    </SafeAreaView>
  );
}
