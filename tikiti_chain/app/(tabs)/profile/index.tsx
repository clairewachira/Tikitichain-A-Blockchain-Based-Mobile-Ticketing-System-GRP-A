import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import Section from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { hexToRgba } from "@/utils/functions";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StatusBar, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const eventTypes: {
    label: string;
  }[] = [
    { label: "education" },
    { label: "literature" },
    { label: "books" },
    { label: "music" },
  ];
  return (
    <SafeAreaView className="flex-1 bg-primary-white pt-4 gap-6">
      <StatusBar
        backgroundColor={colors.primary.white}
        barStyle={"dark-content"}
      />
      <View className="gap-3">
        <View className="flex-row items-center gap-4 px-4">
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D",
            }}
            className="w-24 h-24 rounded-full"
          />
          <View className="">
            <Text variant="interExtraBold" className="text-2xl">
              Claire Wachira
            </Text>
            <Text variant="interMedium">claire@gmail.com</Text>
            <View className="flex-row items-center gap-1">
              <ContainerIcon
                icon="map-marker-outline"
                iconType="MaterialCommunityIcons"
                interactive={false}
                iconSize={16}
              />
              <Text variant="caption">Nairobi, Kenya</Text>
            </View>
          </View>
        </View>
        <ScrollView
          horizontal
          className="min-h-[48px] max-h-[52px]"
          contentContainerClassName="py-2 px-4 gap-1"
          showsHorizontalScrollIndicator={false}
        >
          {eventTypes.map((et) => (
            <Button
              key={et.label}
              name={et.label}
              className="flex-row gap-2 h-[30px] px-6 border border-black rounded-[40px]"
              textClassName="text-black font-interExtraBold text-sm"
            />
          ))}
        </ScrollView>
      </View>
      <Section label="Your event tickets" seeall>
        <FlashList
          estimatedItemSize={3}
          className="ml-4"
          showsHorizontalScrollIndicator={false}
          horizontal
          data={[1, 2, 3]}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-row items-center mr-3">
              {/* Left side of ticket */}
              <View className="relative bg-primary-light_gray p-2 w-[170px] rounded-l-xl">
                {/* Top circle cutout */}

                <View className="flex-row items-start justify-between w-[94%]">
                  <Image
                    source={{
                      uri: "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?cs=srgb&dl=pexels-joshsorenson-976866.jpg&fm=jpg",
                    }}
                    className="w-14 h-14 rounded-md"
                  />
                  <Text className="text-right text-sm font-medium">
                    DECEMBER{"\n"}26
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-black">
                  Book presentation
                </Text>
              </View>

              <View className="w-0.5 h-[100px] bg-primary-white" />
              {/* Right side stub */}
              <View className="relative bg-primary-light_gray p-2 w-[50px] rounded-r-xl items-center justify-center">
                {/* Top circle cutout */}
                <View className="absolute -left-2 top-[-8px] w-4 h-4 rounded-full bg-primary-white z-10" />
                {/* Bottom circle cutout */}
                <View className="absolute -left-2 bottom-[-8px] w-4 h-4 rounded-full bg-primary-white z-10" />

                {/* Ticket stub pattern */}
                <View className="w-[80%] bg-primary-white self-end">
                  {[...Array(15)].map((_, i) => (
                    <View
                      key={i}
                      className={`w-[80%] bg-black h-0.5 self-center ${
                        i % 2 === 0 ? "mb-0.5" : "mb-1"
                      }`}
                    />
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </Section>
      <Section label="Event history" seeall gap={8} className="flex-1">
        <FlashList
          estimatedItemSize={3}
          className="flex-1 mx-4"
          showsVerticalScrollIndicator={false}
          data={[1, 2, 3]}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-row mb-3">
              <Image
                source={{
                  uri: "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?cs=srgb&dl=pexels-joshsorenson-976866.jpg&fm=jpg",
                }}
                className="w-36 h-28 rounded-l-xl"
              />
              <LinearGradient
                colors={[
                  hexToRgba(colors.primary.light_gray, 0.2),
                  hexToRgba(colors.primary.light_gray, 0.5),
                  hexToRgba(colors.primary.light_gray, 0.8),
                ]}
                style={{
                  width: "75%",
                  position: "absolute",
                  zIndex: 20,
                  right: 0,
                  bottom: 0,
                  height: "100%",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  alignSelf: "center",
                  justifyContent: "space-between",
                }}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
              >
                <Text
                  variant="interBold"
                  className="text-xl text-wrap w-[70%]"
                  numberOfLines={2}
                >
                  Hanya Yanahihara book presentation
                </Text>
                <Text
                  variant="interBold"
                  className="bg-primary-white self-end px-2 py-0.5 rounded-full"
                >
                  Dec, 7
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      </Section>
    </SafeAreaView>
  );
}
