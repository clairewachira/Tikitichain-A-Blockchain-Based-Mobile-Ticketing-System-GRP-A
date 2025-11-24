import CustomBottomSheetModal from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import EventCard from "@/components/ui/EventCard";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { useRef } from "react";
import { StatusBar, TouchableOpacity, View, ActivityIndicator } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFavouriteEvents } from "@/hooks/events/useFavourites";

export default function Favourites() {
  const insets = useSafeAreaInsets();
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const { data: favouriteEvents = [], isLoading } = useFavouriteEvents();
  const sortItem: {
    icon: ContainerIconProps["icon"];
    label: string;
  }[] = [
    {
      icon: "progress-clock",
      label: "Upcoming Events",
    },
    {
      icon: "clock-fast",
      label: "Recently Added",
    },
    {
      icon: "star-shooting-outline",
      label: "Most Popular",
    },
    {
      icon: "cash-multiple",
      label: "Cheapest to Expensive",
    },
    {
      icon: "map-marker-radius-outline",
      label: "Nearest to You",
    },
  ];

  const handleSortSheetOpen = () => sortSheetRef.current?.present();
  const handleSortSheetClose = () => sortSheetRef.current?.dismiss();
  return (
    <SafeAreaView className="flex-1 px-4 pt-6 bg-primary-light_gray gap-6">
      <StatusBar backgroundColor={colors.primary.light_gray} />
      <View className="flex-row items-center justify-between">
        <Text variant="subheading" className="text-3xl">
          Favourites
        </Text>
        <TouchableOpacity
          className="flex-row bg-black rounded-full w-12 h-12 items-center justify-center"
          onPress={handleSortSheetOpen}
        >
          <MaterialCommunityIcons
            name="arrow-up"
            size={16}
            color={colors.primary.white}
            className="mt-[-8px]"
          />
          <MaterialCommunityIcons
            name="arrow-down"
            size={16}
            className="mt-[8px] ml-[-8px]"
            color={colors.primary.white}
          />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary.black} />
        </View>
      ) : (
        <FlashList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 72 }}
          data={favouriteEvents}
          estimatedItemSize={240}
          renderItem={({ item }) => (
            <EventCard
              className="rounded-3xl w-full mb-4"
              imageClassName="rounded-3xl"
              imageHeight={240}
              event={item}
              type="description"
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <ContainerIcon
                icon="heart-outline"
                iconType="Ionicons"
                iconSize={64}
                iconColor={colors.primary.dark_gray}
                interactive={false}
              />
              <Text variant="interBold" className="text-xl mt-4 text-primary-dark_gray">
                No favourites yet
              </Text>
              <Text variant="interMedium" className="text-sm mt-2 text-primary-dark_gray text-center px-8">
                Start adding events to your favourites to see them here
              </Text>
            </View>
          }
        />
      )}
      <CustomBottomSheetModal
        ref={sortSheetRef}
        title="Sort by"
        startSnapIndex={5}
        className="px-2 w-full mt-6"
        handleCloseModal={handleSortSheetClose}
      >
        {sortItem.map((si) => (
          <TouchableOpacity
            key={si.label}
            className="px-6 py-4 flex-row items-center border border-black w-full rounded-2xl gap-3"
          >
            <ContainerIcon
              icon={si.icon}
              iconType="MaterialCommunityIcons"
              interactive={false}
            />
            <Text variant="interExtraBold">{si.label}</Text>
          </TouchableOpacity>
        ))}
        <Button
          name="Apply sorting"
          className="bg-black w-[80%] py-5 mt-14 self-center rounded-full"
          textClassName="text-xl"
        />
      </CustomBottomSheetModal>
    </SafeAreaView>
  );
}
