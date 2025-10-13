import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import Section from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { StatusBar, View, TouchableOpacity, ScrollView } from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useState } from "react";

type EventType = {
  leading: ContainerIconProps["icon"];
  iconType: ContainerIconProps["iconType"];
  label: string;
};

export default function Index() {
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const isSelected = (label: string) => selectedInterests.includes(label);

  const education: EventType[] = [
    {
      leading: "book-open-page-variant-outline",
      iconType: "MaterialCommunityIcons",
      label: "Book Launches",
    },
    { leading: "camera-outline", iconType: "Ionicons", label: "Photography" },
    {
      leading: "school-outline",
      iconType: "Ionicons",
      label: "History Lectures",
    },
    { leading: "library-outline", iconType: "Ionicons", label: "Literature" },
    {
      leading: "home-group",
      iconType: "MaterialCommunityIcons",
      label: "Workshops",
    },
    {
      leading: "account-group",
      iconType: "MaterialCommunityIcons",
      label: "Startup Meetups",
    },
    { leading: "newspaper-outline", iconType: "Ionicons", label: "Poetry" },
    {
      leading: "language-outline",
      iconType: "Ionicons",
      label: "Language Exchanges",
    },
  ];

  const culture: EventType[] = [
    { leading: "brush", iconType: "Ionicons", label: "Art Exhibitions" },
    {
      leading: "volume-medium-outline",
      iconType: "Ionicons",
      label: "Music",
    },
    {
      leading: "drama-masks",
      iconType: "MaterialCommunityIcons",
      label: "Theater Performances",
    },
    {
      leading: "festival",
      iconType: "MaterialIcons",
      label: "Cultural Festivals",
    },
    {
      leading: "music-note",
      iconType: "MaterialIcons",
      label: "Dance Shows",
    },
  ];

  const food: EventType[] = [
    {
      leading: "food-croissant",
      iconType: "MaterialCommunityIcons",
      label: "Food Festivals",
    },
    {
      leading: "restaurant-outline",
      iconType: "Ionicons",
      label: "Food and Drinks",
    },
    { leading: "wine", iconType: "Ionicons", label: "Wine Tastings" },
    {
      leading: "tea",
      iconType: "MaterialCommunityIcons",
      label: "Tea Ceremonies",
    },
  ];

  const sports: EventType[] = [
    {
      leading: "basketball-outline",
      iconType: "Ionicons",
      label: "Basketball Tournaments",
    },
    {
      leading: "soccer",
      iconType: "MaterialCommunityIcons",
      label: "Football Matches",
    },
    {
      leading: "run",
      iconType: "MaterialCommunityIcons",
      label: "Marathons",
    },
    {
      leading: "golf-outline",
      iconType: "Ionicons",
      label: "Golf Events",
    },
    {
      leading: "tennisball",
      iconType: "Ionicons",
      label: "Tennis",
    },
    {
      leading: "swim",
      iconType: "MaterialCommunityIcons",
      label: "Swimming",
    },
    {
      leading: "bike",
      iconType: "MaterialCommunityIcons",
      label: "Cycling Races",
    },
    {
      leading: "dumbbell",
      iconType: "MaterialCommunityIcons",
      label: "Fitness Challenges",
    },
  ];

  const renderCategory = (label: string, data: EventType[]) => (
    <Section label={label} className="gap-3">
      <View className="flex-row items-center gap-3 flex-wrap px-4">
        {data.map((item) => {
          const selected = isSelected(item.label);
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => toggleInterest(item.label)}
              activeOpacity={0.8}
              className={`flex-row items-center gap-2 py-2 px-6 rounded-full border ${
                selected
                  ? "bg-black border-black"
                  : "border-black bg-transparent"
              }`}
            >
              <ContainerIcon
                icon={item.leading}
                iconType={item.iconType}
                interactive={false}
                iconSize={20}
                iconColor={
                  selected ? colors.primary.white : colors.primary.black
                }
              />
              <Text
                variant="interRegular"
                className={`text-base ${
                  selected ? "text-white" : "text-black"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Section>
  );

  return (
    <SafeAreaView className="flex-1 w-full py-4 bg-primary-light_gray gap-4">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar
          backgroundColor={colors.primary.light_gray}
          barStyle={"dark-content"}
        />
        <Button
          name="SKIP"
          textClassName="text-black tracking-wider text-lg px-4"
          onPress={() => router.replace("/(auth)")}
          className="self-end"
        />
        <Text variant="subheading" className="text-2xl px-4">
          Customize your interests!
        </Text>
        <Text variant="interMedium" className="text-lg px-4">
          You can change your preferences at any time in the settings.
        </Text>

        {renderCategory("Education and development", education)}
        {renderCategory("Culture and Entertainment", culture)}
        {renderCategory("Food and Drink", food)}
        {renderCategory("Sports and Wellness", sports)}
      </ScrollView>
      <Button
        name="Save"
        textClassName="text-white tracking-wider text-lg"
        onPress={() => {
          console.log("Selected Interests:", selectedInterests);
          router.replace("/(auth)");
        }}
        className="bg-black absolute py-5 left-4 right-4 self-center rounded-full"
        bottom={12}
      />
    </SafeAreaView>
  );
}
