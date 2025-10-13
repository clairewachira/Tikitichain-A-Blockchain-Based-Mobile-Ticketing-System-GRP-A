import CustomBottomSheetModal from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import SearchBar from "@/components/ui/SearchBar";
import { colors } from "@/constants/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

export default function Map() {
  const mapSheetRef = useRef<BottomSheetModal>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const eventTypes: {
    leading: ContainerIconProps["icon"];
    iconType: ContainerIconProps["iconType"];
    label: string;
  }[] = [
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
    { leading: "brush", iconType: "Ionicons", label: "Art Exhibitions" },
    {
      leading: "volume-medium-outline",
      iconType: "Ionicons",
      label: "Music",
    },
    {
      leading: "basketball-outline",
      iconType: "Ionicons",
      label: "Basketball Tournaments",
    },
  ];

  const handleFilterPress = (filter: string) => {
    if (selectedFilter === filter) {
      setSelectedFilter(null);
      //setSearchResults(
      //  mockEvents.filter(
      //    (event) =>
      //      event.title.toLowerCase().includes(searchText.toLowerCase()) ||
      //      event.category.toLowerCase().includes(searchText.toLowerCase()),
      //  ),
      //);
    } else {
      setSelectedFilter(filter);
      //const filtered = mockEvents.filter((event) => {
      //  const matchesSearch =
      //    event.title.toLowerCase().includes(searchText.toLowerCase()) ||
      //    event.category.toLowerCase().includes(searchText.toLowerCase());
      //  const matchesFilter = event.category === filter;
      //  return matchesSearch && matchesFilter;
      //});
      //setSearchResults(filtered);
    }
  };
  const handleMapModalOpen = () => mapSheetRef.current?.present();
  const handleMapModalClose = () => mapSheetRef.current?.dismiss();

  useFocusEffect(
    useCallback(() => {
      console.log("present modal");
      handleMapModalOpen();
      return () => {
        console.log("hide modal");

        handleMapModalClose();
      };
    }, []),
  );
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={{
          longitude: 36.8219,
          latitude: -1.291,
          longitudeDelta: 0.05,
          latitudeDelta: 0.05,
        }}
      />
      <CustomBottomSheetModal
        ref={mapSheetRef}
        startSnapIndex={5}
        className="px-2 w-full mt-6"
        bgColor={colors.primary.light_gray}
      >
        <SearchBar
          placholder="Events, places..."
          className="self-center w-full px-4"
          //value={searchText}
          //onChangeText={handleSearchChange}
          //onSubmitEditing={handleSearchSubmit}
        >
          <ContainerIcon
            //icon={
            //  keyboardShown ? "close" : isSearching ? "arrow-back" : "search"
            //}
            icon="search"
            iconType="Ionicons"
            iconSize={14}
            iconColor={colors.primary.white}
            className="absolute right-7 p-2 bg-black rounded-2xl items-center"
            //handleClick={() => {
            //  if (keyboardShown) {
            //    Keyboard.dismiss();
            //  } else if (isSearching) {
            //    handleBackToSearch();
            //  }
            //}}
          />
        </SearchBar>
        <ScrollView
          horizontal
          className="min-h-[48px] max-h-[52px]"
          contentContainerClassName="py-2 px-4 gap-4"
          showsHorizontalScrollIndicator={false}
        >
          {eventTypes.map((et) => (
            <Button
              key={et.label}
              name={et.label}
              className={`flex-row gap-2 h-[40px] px-7 border rounded-[40px] ${
                selectedFilter === et.label
                  ? "bg-black border-black"
                  : "border-black bg-primary-light_gray"
              }`}
              leading={
                <ContainerIcon
                  iconType={et.iconType}
                  icon={et.leading}
                  iconSize={16}
                  iconColor={
                    selectedFilter === et.label
                      ? colors.primary.white
                      : colors.primary.black
                  }
                  interactive={false}
                />
              }
              textClassName={`font-interSemiBold text-sm ${
                selectedFilter === et.label ? "text-white" : "text-black"
              }`}
              onPress={() => handleFilterPress(et.label)}
            />
          ))}
        </ScrollView>
      </CustomBottomSheetModal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
