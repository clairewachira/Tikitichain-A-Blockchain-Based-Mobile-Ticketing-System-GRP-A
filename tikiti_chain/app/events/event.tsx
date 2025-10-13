import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import EventCard from "@/components/ui/EventCard";
import Section from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { cn } from "@/utils/cn";
import { hexToRgba } from "@/utils/functions";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function EventScreen() {
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-primary-light_gray">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView
        style={{ paddingTop: insets.top, paddingHorizontal: 16 }}
        className={cn(
          "absolute top-0 left-0 right-0 z-[60] flex-row items-center justify-between",
        )}
      >
        <ContainerIcon
          icon="arrow-back"
          iconType="Ionicons"
          className={`p-2 bg-white ${Platform.OS === "ios" && "ml-4"}`}
          iconColor={colors.primary.black}
          handleClick={router.back}
        />
        <ContainerIcon
          icon="share-outline"
          iconType="Ionicons"
          className={`p-2 bg-white ${Platform.OS === "ios" && "mr-4"}`}
          iconColor={colors.primary.black}
        />
      </SafeAreaView>

      <View
        className="flex-row items-center gap-2 absolute right-4 z-20"
        style={{ top: height * 0.33 }}
      >
        <Text variant="interBold" className="px-2 py-1 bg-white rounded-full">
          07 December
        </Text>
        <Text variant="interBold" className="px-2 py-1 bg-white rounded-full">
          19:00
        </Text>
      </View>
      <View
        style={[
          styles.backgroundImage,
          { backgroundColor: hexToRgba(colors.primary.black, 0.5), zIndex: 10 },
        ]}
      />
      <Image
        source={{
          uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3DNasCvfOLMIxJyQtbNq7EfLkWnMazHE9xw&s",
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Scrollable Content Overlay */}
      <ScrollView
        className="flex-1 z-50"
        contentContainerClassName="grow"
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer to push content to bottom initially */}
        <View style={styles.spacer} />

        {/* Content Card */}
        <View
          className="bg-primary-light_gray rounded-t-3xl pt-5 px-4 gap-6"
          style={{ paddingBottom: insets.bottom + 128 }}
        >
          {/* Title and Bookmark */}
          <View className="flex-row items-start justify-between gap-12">
            <Text variant="heading" className="flex-1 text-4xl tracking-wider">
              Hanya Yanagihara book presentation
            </Text>
            <ContainerIcon
              icon="bookmark-outline"
              iconType="Ionicons"
              iconSize={30}
            />
          </View>

          {/* Tags */}
          <View className="flex-row items-center flex-wrap gap-1">
            {["education", "literature", "books", "more+"].map((t) => (
              <Text
                key={t}
                variant="interExtraBold"
                className="px-5 py-0.5 border border-black rounded-full"
              >
                {t}
              </Text>
            ))}
          </View>

          {/* Description */}
          <Text variant="interMedium" className="text-lg">
            Join the literary event of the year - the presentation of the cult
            novel &quot;Little Life&quot; together with the author Ganya
            Yanagigara. A warm conversation about the book, a creation and
            answer session, and an exclusive opportunity to get an autograph
            from the author await you.
          </Text>
          <TouchableOpacity className="flex-row border border-black p-1 rounded-full items-center justify-between">
            <View className="ml-6">
              <Text variant="interBold" className="text-sm">
                iHub
              </Text>
              <Text variant="interSemiBold">Westlands, Nairobi, Kenya</Text>
            </View>
            <ContainerIcon
              icon="map-marker"
              iconType="MaterialCommunityIcons"
              className="bg-black w-14 h-14"
              iconColor={colors.primary.white}
              interactive={false}
            />
          </TouchableOpacity>
          <Section label="Gallery" className="px-0"></Section>
          <Section label="You may also like" className="px-0" gap={16}>
            <FlashList
              estimatedItemSize={3}
              contentContainerClassName="gap-5"
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[1, 2, 3]}
              renderItem={({ item }) => (
                <EventCard
                  className="rounded-2xl w-[280px] mr-4"
                  imageHeight={200}
                />
              )}
            />
          </Section>
        </View>
      </ScrollView>
      <View
        className="flex-row items-center justify-between absolute bottom-0 left-0 right-0 shadow-3xl shadow-black bg-neutral-100 px-5 pt-5 z-50 rounded-t-[30px]"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="">
          <Text variant="caption">Price</Text>
          <Text variant="interExtraBold" className="text-lg">
            0.05 BTC
          </Text>
        </View>
        <Button
          name="Buy a ticket"
          className="bg-black px-12 py-4 rounded-full"
          textClassName="tracking-widest"
          onPress={() => router.push("/events/ticketdetails")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    width: width,
    height: height * 0.4,
    top: 0,
  },
  spacer: {
    height: height * 0.38, // Adjust this to control initial content position
  },
});
