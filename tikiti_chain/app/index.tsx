import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { Dimensions, StatusBar, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("screen");
export default function Index() {
  const router = useSafeRouter();

  const types: {
    icon: ContainerIconProps["icon"];
    iconType: ContainerIconProps["iconType"];
    label: string;
  }[] = [
    {
      icon: "palette-outline",
      iconType: "MaterialCommunityIcons",
      label: `Entertainment\nand culture`,
    },
    {
      icon: "sports-gymnastics",
      iconType: "MaterialIcons",
      label: `Health and\nactive lifestyle`,
    },
    {
      icon: "book-outline",
      iconType: "Ionicons",
      label: `Education and\ndevelopment`,
    },
    {
      icon: "food-croissant",
      iconType: "MaterialCommunityIcons",
      label: `Gastronomy\nand lifestyle`,
    },
  ];
  const [selectedType, setSelectedType] = useState(types[0]);
  return (
    <SafeAreaView className="flex-1 w-full p-5 bg-primary-light_gray gap-4">
      <StatusBar
        backgroundColor={colors.primary.light_gray}
        barStyle={"dark-content"}
      />
      <Button
        name="SKIP"
        textClassName="text-black tracking-wider text-lg"
        onPress={() => router.replace("/(auth)")}
        className="self-end"
      />
      <Text variant="subheading" className="text-2xl">
        Do you have favourite types of activities?
      </Text>
      <Text variant="interMedium" className="text-lg">
        You can change your preferences at any time in the settings.
      </Text>
      <View className="flex-row flex-wrap w-full justify-between">
        {types.map((t) => (
          <TouchableOpacity
            key={t.label}
            className={cn(
              "p-5 border border-black mb-4 rounded-xl gap-3",
              t.label === selectedType.label && "bg-black",
            )}
            style={{ width: width * 0.43 }}
            onPress={() => setSelectedType(t)}
          >
            <ContainerIcon
              icon={t.icon}
              iconType={t.iconType}
              iconSize={100}
              interactive={false}
              className="mt-4"
              iconColor={
                t.label === selectedType.label
                  ? colors.primary.white
                  : colors.primary.black
              }
            />
            <Text
              variant="interBold"
              className={cn(
                "text-center",

                t.label === selectedType.label ? "text-white" : "text-black",
              )}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button
        name="Save"
        textClassName="text-white tracking-wider text-lg"
        onPress={() => router.replace("/interests")}
        className="bg-black absolute w-full py-5 self-center rounded-full"
        bottom={12}
      />
    </SafeAreaView>
  );
}
