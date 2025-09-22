import Button from "@/components/ui/Button";
import { useSafeRouter } from "@/hooks/navigation/router";
import { StatusBar, View } from "react-native";
import Avatar from "../../assets/illustrations/avatar.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import Toast from "react-native-toast-message";

export default function Index() {
  const router = useSafeRouter();

  return (
    <SafeAreaView className="flex-1 px-5 pt-5 pb-60 bg-primary-light_gray">
      <StatusBar
        backgroundColor={colors.primary.light_gray}
        barStyle={"dark-content"}
      />
      <Button
        name="SKIP"
        textClassName="text-black tracking-wider text-lg"
        onPress={() => router.replace("/(tabs)")}
        className="self-end"
      />
      <Text variant="subheading" className="text-3xl">
        Let&apos;s get{"\n"}started!
      </Text>
      <View className="flex-1 items-center justify-center">
        <Avatar width={250} height={250} />
      </View>
      <View className="gap-3">
        <Button
          leading={
            <Ionicons
              name="mail-outline"
              size={24}
              color={colors.primary.black}
            />
          }
          name="Continue with Email"
          onPress={() => router.navigate("/signin")}
          textClassName="text-black text-lg font-interBold"
          className="py-4 gap-6 border-2 border-black rounded-full"
        />
        <Button
          leading={
            <MaterialIcons
              name="apple"
              size={24}
              color={colors.primary.black}
            />
          }
          name="Continue with Apple"
          onPress={() =>
            Toast.show({
              type: "warning",
              text1: "Currently Unavailable!",
              text2: "Coming Soon!",
            })
          }
          textClassName="text-black text-lg font-interBold"
          className="py-4 gap-6 border-2 border-black rounded-full"
        />
        <Button
          leading={
            <Ionicons
              name="logo-google"
              size={24}
              color={colors.primary.black}
            />
          }
          name="Continue with Google"
          onPress={() =>
            Toast.show({
              type: "warning",
              text1: "Currently Unavailable!",
              text2: "Coming Soon!",
            })
          }
          textClassName="text-black text-lg font-interBold"
          className="py-4 gap-6 border-2 border-black rounded-full"
        />
      </View>
    </SafeAreaView>
  );
}
