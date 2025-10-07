import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import SearchBar from "@/components/ui/SearchBar";
import Section from "@/components/ui/Section";
import { colors } from "@/constants/colors";
import {
  Dimensions,
  Keyboard,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useIsKeyboardShown } from "@/hooks/general/keyboard";
import EventCard from "@/components/ui/EventCard";
import { useRef, useState } from "react";
import SearchHistory from "@/components/ui/SearchHistory";
import { Text } from "@/components/ui/Text";
import CustomBottomSheetModal from "@/components/ui/BottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Slider from "@react-native-community/slider";
const { width } = Dimensions.get("screen");

// Mock data for search results
const mockEvents = [
  {
    id: 1,
    title: "Graphic Design Beyond Boundaries",
    location: "at. Antonycha, 50, Kyiv",
    date: "Dec. 7",
    price: "700 UAH",
    rating: "9.6",
    image:
      "https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "visual arts",
  },
  {
    id: 2,
    title: "Design Perspectives: Exploring the Future of Aesthetics",
    location: "Creative Hub, Kyiv",
    date: "Dec. 7",
    price: "900 UAH",
    rating: "9.2",
    image:
      "https://images.pexels.com/photos/1260309/pexels-photo-1260309.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "visual arts",
  },
  {
    id: 3,
    title: "UX/UI Design Workshop",
    location: "Tech Center, Kyiv",
    date: "Dec. 8",
    price: "1200 UAH",
    rating: "9.8",
    image:
      "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "education",
  },
  {
    id: 4,
    title: "Digital Design Masterclass",
    location: "Design Studio, Kyiv",
    date: "Dec. 9",
    price: "850 UAH",
    rating: "9.4",
    image:
      "https://images.pexels.com/photos/326503/pexels-photo-326503.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "visual arts",
  },
];

export default function Index() {
  const [searchText, setSearchText] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "spaghetti",
    "hamburger",
    "sushi",
    "noodles",
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(mockEvents);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const sortSheetRef = useRef<BottomSheetModal>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const keyboardShown = useIsKeyboardShown();

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

  const handleFilterSheetOpen = () => filterSheetRef.current?.present();
  const handleFilterSheetClose = () => filterSheetRef.current?.dismiss();
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowHistory(!(text.length > 0) && !isSearching);

    // If user clears search, go back to home
    if (text.length === 0) {
      setIsSearching(false);
      setSelectedFilter(null);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchText) return;

    // Add to search history
    if (searchText.trim() && !searchHistory.includes(searchText)) {
      setSearchHistory([searchText, ...searchHistory]);
    }

    // Perform search
    setIsSearching(true);
    setShowHistory(false);

    // Mock search filtering
    const filtered = mockEvents.filter(
      (event) =>
        event.title.toLowerCase().includes(searchText.toLowerCase()) ||
        event.category.toLowerCase().includes(searchText.toLowerCase()),
    );
    setSearchResults(filtered);
    Keyboard.dismiss();
  };

  const removeSearchItem = (item: string) => {
    setSearchHistory(searchHistory.filter((search) => search !== item));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleFilterPress = (filter: string) => {
    if (selectedFilter === filter) {
      setSelectedFilter(null);
      setSearchResults(
        mockEvents.filter(
          (event) =>
            event.title.toLowerCase().includes(searchText.toLowerCase()) ||
            event.category.toLowerCase().includes(searchText.toLowerCase()),
        ),
      );
    } else {
      setSelectedFilter(filter);
      const filtered = mockEvents.filter((event) => {
        const matchesSearch =
          event.title.toLowerCase().includes(searchText.toLowerCase()) ||
          event.category.toLowerCase().includes(searchText.toLowerCase());
        const matchesFilter = event.category === filter;
        return matchesSearch && matchesFilter;
      });
      setSearchResults(filtered);
    }
  };

  const handleBackToSearch = () => {
    setSearchText("");
    setIsSearching(false);
    setSelectedFilter(null);
    setShowHistory(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-light_gray py-6 gap-6">
      <StatusBar
        backgroundColor={colors.primary.light_gray}
        barStyle={"dark-content"}
      />

      <View className="gap-3">
        <SearchBar
          placholder="Events, places..."
          className="self-center w-full px-4"
          value={searchText}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
        >
          <ContainerIcon
            icon={
              keyboardShown ? "close" : isSearching ? "arrow-back" : "search"
            }
            iconType="Ionicons"
            iconSize={14}
            iconColor={colors.primary.white}
            className="absolute right-7 p-2 bg-black rounded-2xl items-center"
            handleClick={() => {
              if (keyboardShown) {
                Keyboard.dismiss();
              } else if (isSearching) {
                handleBackToSearch();
              }
            }}
          />
        </SearchBar>

        {/* Search History */}
        {keyboardShown && showHistory && (
          <SearchHistory
            searchHistory={searchHistory}
            removeSearchItem={removeSearchItem}
            clearSearchHistory={clearSearchHistory}
            setSearchText={setSearchText}
            setShowHistory={setShowHistory}
          />
        )}

        {/* Filter Buttons - Show when searching or when not searching and keyboard not shown */}
        {isSearching && !keyboardShown && (
          <View className="flex-row gap-3 px-4">
            {/* Filters Button */}
            <Button
              name="Filters"
              className="flex-row gap-3 h-[40px] px-4 border border-black rounded-[40px] bg-primary-light_gray flex-1"
              leading={
                <ContainerIcon
                  iconType="MaterialCommunityIcons"
                  icon="tune"
                  iconSize={20}
                  interactive={false}
                />
              }
              textClassName="text-black font-interBold"
              onPress={handleFilterSheetOpen}
            />

            {/* Sort by Button */}
            <Button
              name="Sort by"
              className="flex-row gap-3 h-[40px] px-4 border border-black rounded-[40px] bg-primary-light_gray flex-1"
              leading={
                <ContainerIcon
                  iconType="MaterialCommunityIcons"
                  icon="sort-variant"
                  iconSize={20}
                  interactive={false}
                />
              }
              textClassName="text-black font-interBold"
              onPress={handleSortSheetOpen}
            />
          </View>
        )}

        {/* Category Filter Buttons - Show only when not searching */}
        {/*
        {!isSearching && (
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
                className="flex-row gap-2 h-[40px] px-7 border border-black rounded-[40px]"
                leading={
                  <ContainerIcon
                    iconType={et.iconType}
                    icon={et.leading}
                    iconSize={16}
                    interactive={false}
                  />
                }
                textClassName="text-black font-interSemiBold text-sm"
              />
            ))}
          </ScrollView>
        )}
                */}

        {/* Category Filter Buttons - Show when searching */}
        {!isSearching && !keyboardShown && (
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
        )}
      </View>

      {/* Search Results */}
      {isSearching && !keyboardShown && (
        <ScrollView
          contentContainerClassName="w-full pb-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 mb-4">
            <Text variant="subheading" className="text-lg font-interSemiBold">
              Found {searchResults.length} events
            </Text>
          </View>

          <FlashList
            data={searchResults}
            estimatedItemSize={350}
            contentContainerClassName="px-4"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="mb-4 mx-4">
                <EventCard
                  className="rounded-2xl w-full"
                  imageClassName="rounded-2xl"
                  imageHeight={250}
                  //title={item.title}
                  //location={item.location}
                  //date={item.date}
                  //price={item.price}
                  //rating={item.rating}
                  //image={item.image}
                />
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-gray-500 text-center">
                  No events found matching &quot;{searchText}&quot;
                </Text>
              </View>
            }
          />
        </ScrollView>
      )}

      {/* Home Content - Show when not searching */}
      {!keyboardShown && !isSearching && (
        <ScrollView
          contentContainerClassName="w-full pb-6 gap-6"
          showsVerticalScrollIndicator={false}
        >
          <Section label="Recommendations" gap={16}>
            <FlashList
              estimatedItemSize={3}
              contentContainerClassName="gap-5 px-4"
              showsHorizontalScrollIndicator={false}
              horizontal
              data={[1, 2, 3]}
              renderItem={({ item }) => (
                <EventCard
                  className="rounded-2xl w-[330px] mr-4"
                  imageClassName="rounded-2xl"
                  imageHeight={300}
                  type="description"
                />
              )}
            />
          </Section>
          <Section label="Today events" seeall gap={16}>
            <FlashList
              estimatedItemSize={3}
              contentContainerClassName="gap-5 px-4"
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
        </ScrollView>
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
      <CustomBottomSheetModal
        ref={filterSheetRef}
        title="Filters"
        startSnapIndex={5}
        className="px-2 w-full mt-6 gap-8"
        handleCloseModal={handleFilterSheetClose}
      >
        <Section label="Event types" seeall gap={8} padding={false}>
          <View className="flex-row items-center gap-4 flex-wrap">
            {eventTypes.map((et) => (
              <Button
                key={et.label}
                name={et.label}
                className={`flex-row gap-2 h-[36px] px-7 border rounded-[40px] ${
                  selectedFilter === et.label
                    ? "bg-black border-black"
                    : "border-black bg-white"
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
          </View>
        </Section>
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text variant="subheading" className="text-black">
              Price
            </Text>
            <Text variant="interMedium" className="text-black">
              0.001 - 0.5 BTC
            </Text>
          </View>

          <Slider
            style={{ width: "100%", height: 20 }}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={colors.primary.black}
            maximumTrackTintColor="#000000"
            thumbTintColor={colors.primary.black}
          />
        </View>
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text variant="subheading" className="text-black">
              Maximum distance
            </Text>
            <Text variant="interMedium" className="text-black">
              10 Km
            </Text>
          </View>

          <Slider
            style={{ width: "100%", height: 20 }}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={colors.primary.black}
            maximumTrackTintColor="#000000"
            thumbTintColor={colors.primary.black}
          />
        </View>
        <Button
          name="Apply sorting"
          className="bg-black w-[80%] py-5 mt-14 self-center rounded-full"
          textClassName="text-xl"
        />
      </CustomBottomSheetModal>
    </SafeAreaView>
  );
}
