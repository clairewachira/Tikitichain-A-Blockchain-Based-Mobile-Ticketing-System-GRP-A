import CustomBottomSheetModal from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import ContainerIcon, {
  ContainerIconProps,
} from "@/components/ui/ContainerIcon";
import SearchBar from "@/components/ui/SearchBar";
import { colors } from "@/constants/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Callout,
} from "react-native-maps";
import * as Location from "expo-location";
import { useEvents } from "@/hooks/events/useEvents";
import { Event } from "@/types/event";
import { Text } from "@/components/ui/Text";
import { FlashList } from "@shopify/flash-list";

export default function Map() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const mapSheetRef = useRef<BottomSheetModal>(null);

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [showEventList, setShowEventList] = useState(false);

  const { data: events = [], isLoading: eventsLoading } = useEvents();

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

  // Request location permissions and get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to show nearby events"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      // Center map on user location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    })();
  }, []);

  // Filter events based on search and category
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchText === "" ||
      event.title.toLowerCase().includes(searchText.toLowerCase()) ||
      event.location.city.toLowerCase().includes(searchText.toLowerCase());

    const matchesFilter =
      !selectedFilter || event.category === selectedFilter;

    // Only show events with valid coordinates
    const hasValidLocation =
      event.location?.latitude && event.location?.longitude;

    return matchesSearch && matchesFilter && hasValidLocation;
  });

  const handleFilterPress = (filter: string) => {
    if (selectedFilter === filter) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(filter);
    }
  };

  const handleMapModalOpen = () => mapSheetRef.current?.present();
  const handleMapModalClose = () => mapSheetRef.current?.dismiss();

  const handleMarkerPress = (event: Event) => {
    setSelectedEvent(event);
    setShowEventList(false);

    // Animate map to event location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: event.location.latitude,
        longitude: event.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleEventPress = (event: Event) => {
    router.push(`/events/${event.id}`);
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === "standard" ? "satellite" : "standard"));
  };

  const fitAllMarkers = () => {
    if (filteredEvents.length > 0 && mapRef.current) {
      const coordinates = filteredEvents.map((event) => ({
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

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
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={{
          longitude: 36.8219,
          latitude: -1.291,
          longitudeDelta: 0.05,
          latitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* Event Markers */}
        {filteredEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.location.latitude,
              longitude: event.location.longitude,
            }}
            pinColor={selectedEvent?.id === event.id ? colors.primary.black : "red"}
            onPress={() => handleMarkerPress(event)}
          >
            <Callout
              onPress={() => handleEventPress(event)}
              tooltip={false}
            >
              <View style={styles.calloutContainer}>
                <Text variant="interBold" className="text-sm mb-1">
                  {event.title}
                </Text>
                <Text variant="interMedium" className="text-xs text-gray-600 mb-1">
                  {event.location.city}
                </Text>
                <Text variant="interBold" className="text-xs text-primary-black">
                  ${event.price}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="You are here"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        {/* User Location Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnUserLocation}
        >
          <ContainerIcon
            icon="locate"
            iconType="Ionicons"
            iconSize={20}
            iconColor={colors.primary.black}
            interactive={false}
          />
        </TouchableOpacity>

        {/* Map Type Toggle */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleMapType}
        >
          <ContainerIcon
            icon="layers"
            iconType="Ionicons"
            iconSize={20}
            iconColor={colors.primary.black}
            interactive={false}
          />
        </TouchableOpacity>

        {/* Fit All Markers */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={fitAllMarkers}
        >
          <ContainerIcon
            icon="expand"
            iconType="Ionicons"
            iconSize={20}
            iconColor={colors.primary.black}
            interactive={false}
          />
        </TouchableOpacity>

        {/* Toggle Event List */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowEventList(!showEventList)}
        >
          <ContainerIcon
            icon={showEventList ? "map" : "list"}
            iconType="Ionicons"
            iconSize={20}
            iconColor={colors.primary.black}
            interactive={false}
          />
        </TouchableOpacity>
      </View>

      {/* Event Count Badge */}
      {!eventsLoading && (
        <View style={styles.eventCountBadge}>
          <Text variant="interBold" className="text-white text-xs">
            {filteredEvents.length} Events
          </Text>
        </View>
      )}

      {/* Loading Indicator */}
      {eventsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary.black} />
        </View>
      )}

      <CustomBottomSheetModal
        ref={mapSheetRef}
        startSnapIndex={5}
        className="px-2 w-full mt-6"
        bgColor={colors.primary.light_gray}
      >
        <SearchBar
          placholder="Events, places..."
          className="self-center w-full px-4"
          value={searchText}
          onChangeText={setSearchText}
        >
          <ContainerIcon
            icon="search"
            iconType="Ionicons"
            iconSize={14}
            iconColor={colors.primary.white}
            className="absolute right-7 p-2 bg-black rounded-2xl items-center"
          />
        </SearchBar>

        {/* Category Filters */}
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

        {/* Event List View */}
        {showEventList && (
          <View className="flex-1 px-4 pb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text variant="interBold" className="text-lg">
                Nearby Events
              </Text>
              <Text variant="interMedium" className="text-sm text-gray-600">
                {filteredEvents.length} found
              </Text>
            </View>

            {filteredEvents.length > 0 ? (
              <FlashList
                data={filteredEvents}
                keyExtractor={(item) => item.id}
                estimatedItemSize={100}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleEventPress(item)}
                    className="flex-row gap-3 p-3 mb-2 bg-white rounded-xl border border-gray-200"
                  >
                    <View className="flex-1">
                      <Text variant="interBold" className="text-sm mb-1">
                        {item.title}
                      </Text>
                      <Text
                        variant="interMedium"
                        className="text-xs text-gray-600 mb-1"
                      >
                        {item.location.city}, {item.location.country}
                      </Text>
                      <Text variant="interBold" className="text-xs">
                        ${item.price}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMarkerPress(item);
                      }}
                      className="justify-center"
                    >
                      <ContainerIcon
                        icon="location"
                        iconType="Ionicons"
                        iconSize={24}
                        iconColor={colors.primary.black}
                        interactive={false}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View className="items-center justify-center py-10">
                <Text variant="interMedium" className="text-gray-500">
                  No events found in this area
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Selected Event Details */}
        {selectedEvent && !showEventList && (
          <View className="px-4 pb-4">
            <TouchableOpacity
              onPress={() => handleEventPress(selectedEvent)}
              className="bg-white rounded-xl border-2 border-black p-4"
            >
              <Text variant="interBold" className="text-lg mb-2">
                {selectedEvent.title}
              </Text>
              <View className="flex-row items-center gap-2 mb-2">
                <ContainerIcon
                  icon="location"
                  iconType="Ionicons"
                  iconSize={16}
                  iconColor={colors.primary.black}
                  interactive={false}
                />
                <Text variant="interMedium" className="text-sm text-gray-600">
                  {selectedEvent.location.address || selectedEvent.location.city}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text variant="interBold" className="text-base">
                  ${selectedEvent.price}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text variant="interMedium" className="text-xs text-gray-600">
                    Tap to view details
                  </Text>
                  <ContainerIcon
                    icon="chevron-forward"
                    iconType="Ionicons"
                    iconSize={16}
                    iconColor={colors.primary.black}
                    interactive={false}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  mapControls: {
    position: "absolute",
    right: 16,
    top: 60,
    gap: 12,
  },
  controlButton: {
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventCountBadge: {
    position: "absolute",
    top: 60,
    left: 16,
    backgroundColor: colors.primary.black,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
});
