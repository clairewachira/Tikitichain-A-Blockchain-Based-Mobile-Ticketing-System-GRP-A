import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import Section from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { supabase } from "@/utils/supabase";
import { StatusBar, View, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Toast } from "toastify-react-native";
import { useUpdateUserPreferences } from "@/hooks/recommendation/useRecommendations";
import { useAuthContext } from "@/hooks/auth/use-auth-context";

type EventType = {
  leading: ContainerIconProps["icon"];
  iconType: ContainerIconProps["iconType"];
  label: string;
};

export default function Index() {
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthContext();
  const updatePreferences = useUpdateUserPreferences();
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

  const technology: EventType[] = [
    {
      leading: "code-braces",
      iconType: "MaterialCommunityIcons",
      label: "Tech Conferences",
    },
    {
      leading: "bitcoin",
      iconType: "MaterialCommunityIcons",
      label: "Blockchain & Crypto",
    },
    {
      leading: "cellphone-cog",
      iconType: "MaterialCommunityIcons",
      label: "App Development",
    },
    {
      leading: "robot-outline",
      iconType: "MaterialCommunityIcons",
      label: "AI & Machine Learning",
    },
  ];

  const business: EventType[] = [
    {
      leading: "briefcase-outline",
      iconType: "Ionicons",
      label: "Networking Events",
    },
    {
      leading: "rocket-launch",
      iconType: "MaterialCommunityIcons",
      label: "Startup Events",
    },
    {
      leading: "school-outline",
      iconType: "MaterialCommunityIcons",
      label: "Career Development",
    },
    {
      leading: "chart-line",
      iconType: "MaterialCommunityIcons",
      label: "Finance & Investment",
    },
  ];

  const entertainment: EventType[] = [
    {
      leading: "gamepad-variant-outline",
      iconType: "MaterialCommunityIcons",
      label: "Gaming Tournaments",
    },
    {
      leading: "emoticon-lol-outline",
      iconType: "MaterialCommunityIcons",
      label: "Comedy Shows",
    },
    {
      leading: "film-outline",
      iconType: "Ionicons",
      label: "Movie Screenings",
    },
  ];

  const healthWellness: EventType[] = [
    {
      leading: "yoga",
      iconType: "MaterialCommunityIcons",
      label: "Yoga & Meditation",
    },
    {
      leading: "spa-outline",
      iconType: "MaterialCommunityIcons",
      label: "Wellness Retreats",
    },
    {
      leading: "brain",
      iconType: "MaterialCommunityIcons",
      label: "Mental Health",
    },
  ];

  const shopping: EventType[] = [
    {
      leading: "cart-outline",
      iconType: "Ionicons",
      label: "Markets & Bazaars",
    },
    {
      leading: "storefront-outline",
      iconType: "MaterialCommunityIcons",
      label: "Pop-Up Shops",
    },
    {
      leading: "hand-heart-outline",
      iconType: "MaterialCommunityIcons",
      label: "Artisan Crafts",
    },
  ];

  const familyKids: EventType[] = [
    {
      leading: "people-outline",
      iconType: "Ionicons",
      label: "Family Events",
    },
    {
      leading: "test-tube",
      iconType: "MaterialCommunityIcons",
      label: "Kids Activities",
    },
    {
      leading: "balloon-outline",
      iconType: "Ionicons",
      label: "Children's Shows",
    },
  ];

  const fashion: EventType[] = [
    {
      leading: "tshirt-crew-outline",
      iconType: "MaterialCommunityIcons",
      label: "Fashion Shows",
    },
    {
      leading: "sparkles-outline",
      iconType: "Ionicons",
      label: "Beauty Workshops",
    },
  ];

  const community: EventType[] = [
    {
      leading: "heart-outline",
      iconType: "Ionicons",
      label: "Charity Events",
    },
    {
      leading: "hand-heart-outline",
      iconType: "MaterialCommunityIcons",
      label: "Volunteer Work",
    },
    {
      leading: "people-circle-outline",
      iconType: "Ionicons",
      label: "Community Gatherings",
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
          name="SKIP FOR NOW"
          textClassName="text-black tracking-wider text-lg px-4"
          onPress={() => {
            Toast.info("You can set your preferences later in settings");
            router.replace("/(tabs)");
          }}
          className="self-end"
        />
        <Text variant="subheading" className="text-2xl px-4">
          Customize your interests!
        </Text>
        <Text variant="interMedium" className="text-lg px-4">
          You can change your preferences at any time in the settings.
        </Text>

        {renderCategory("Education and Development", education)}
        {renderCategory("Culture and Entertainment", culture)}
        {renderCategory("Food and Drink", food)}
        {renderCategory("Sports and Wellness", sports)}
        {renderCategory("Technology and Innovation", technology)}
        {renderCategory("Business and Professional", business)}
        {renderCategory("Entertainment", entertainment)}
        {renderCategory("Health and Wellness", healthWellness)}
        {renderCategory("Shopping and Markets", shopping)}
        {renderCategory("Family and Kids", familyKids)}
        {renderCategory("Fashion and Beauty", fashion)}
        {renderCategory("Community and Charity", community)}
      </ScrollView>
      <Button
        name={updatePreferences.isPending ? "Saving..." : "Save"}
        textClassName="text-white tracking-wider text-lg"
        onPress={async () => {
          if (selectedInterests.length === 0) {
            Toast.warn("Please select at least one interest");
            return;
          }

          try {
            // Convert selected interests to category preferences format
            // Each selected interest gets a score of 5 (high preference)
            const category_preferences: Record<string, number> = {};
            selectedInterests.forEach((interest) => {
              category_preferences[interest] = 5;
            });

            await updatePreferences.mutateAsync({
              category_preferences,
              price_range: [0, 1000], // Default price range
              location_preferences: {
                latitude: 0,
                longitude: 0,
                radius_km: 50, // Default 50km radius
              },
              time_preferences: {
                preferred_days: [0, 1, 2, 3, 4, 5, 6], // All days
                preferred_hours: [9, 22], // 9 AM to 10 PM
              },
            });

            Toast.success("Interests saved successfully!");
            router.replace("/(tabs)");
          } catch (error) {
            console.error("Error saving interests:", error);
            Toast.error("Failed to save interests. Please try again.");
          }
        }}
        disabled={updatePreferences.isPending}
        className="bg-black absolute py-5 left-4 right-4 self-center rounded-full"
        bottom={12}
      />
    </SafeAreaView>
  );
}
