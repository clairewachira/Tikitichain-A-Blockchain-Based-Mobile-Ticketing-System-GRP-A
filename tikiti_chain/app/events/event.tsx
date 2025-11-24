import Button from "@/components/ui/Button";
import ContainerIcon from "@/components/ui/ContainerIcon";
import EventCard from "@/components/ui/EventCard";
import Loader from "@/components/ui/Loader";
import Section from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import { useEvent } from "@/hooks/events/useEvents";
import { useSafeRouter } from "@/hooks/navigation/router";
import { Event } from "@/types/event";
import { cn } from "@/utils/cn";
import { formatTime, hexToRgba } from "@/utils/functions";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaggeredList from "@mindinventory/react-native-stagger-view";
import {
  useToggleInteraction,
  useUserInteractions,
  useEventInteractions,
  useEventAttendees,
  useTrackView,
} from "@/hooks/interactions/useInteractions";
import { useFriendsAttending } from "@/hooks/interactions/useSocialConnections";
import { Share } from "react-native";
import AttendeesModal from "@/components/ui/AttendeesModal";
import { useUserBlockchainTickets } from "@/hooks/blockchain/useBlockchainEvents";

const { width, height } = Dimensions.get("window");

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { data: event, isLoading: isFetchingEvent, error } = useEvent(id);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log("Event screen - ID:", id);
    console.log("Event screen - Event data:", event);
    console.log("Event screen - Error:", error);
  }, [id, event, error]);

  // Interaction hooks
  const { data: userInteractions = [] } = useUserInteractions(id);
  const { data: eventInteractions } = useEventInteractions(id);
  const { data: attendees = [] } = useEventAttendees(id);
  const { data: friendsAttending = [] } = useFriendsAttending(id);
  const toggleInteraction = useToggleInteraction();
  const trackView = useTrackView();

  // Blockchain tickets
  const { data: userTickets = [] } = useUserBlockchainTickets(id);

  // Track view when component mounts
  React.useEffect(() => {
    if (id) {
      trackView.mutate({ eventId: id });
    }
  }, [id]);

  const isLiked = userInteractions.includes("like");
  const isFavorited = userInteractions.includes("favorite");
  const isAttending = userInteractions.includes("attend");
  // Check if user has blockchain ticket for this event
  const hasBlockchainTicket = userTickets.length > 0;
  // Check if event has passed
  const eventHasPassed = event?.time ? new Date(event.time) < new Date() : false;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event?.title}`,
        url: `tikiti://events/event?id=${id}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleClick = (uri: string) => {
    router.push({
      pathname: "/images-preview",
      params: { uri },
    });
  };

  if (isFetchingEvent) return <Loader />;
  return (
    <View className="flex-1 bg-primary-light_gray">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <SafeAreaView
        style={{ paddingHorizontal: 16 }}
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
        <View className="flex-row gap-2">
          <ContainerIcon
            icon={isLiked ? "heart" : "heart-outline"}
            iconType="Ionicons"
            className={`p-2 bg-white ${Platform.OS === "ios" && "mr-1"}`}
            iconColor={isLiked ? colors.secondary.red : colors.primary.black}
            handleClick={() =>
              toggleInteraction.mutate({ eventId: id, interactionType: "like" })
            }
          />
          <ContainerIcon
            icon="share-outline"
            iconType="Ionicons"
            className={`p-2 bg-white ${Platform.OS === "ios" && "mr-4"}`}
            iconColor={colors.primary.black}
            handleClick={handleShare}
          />
        </View>
      </SafeAreaView>

      <View
        className="flex-row items-center gap-2 absolute right-4 z-20"
        style={{ top: height * 0.33 }}
      >
        <Text variant="interBold" className="px-2 py-1 bg-white rounded-full">
          {event?.time && formatTime(event.time, { fullMonth: true })}
        </Text>
        <Text variant="interBold" className="px-2 py-1 bg-white rounded-full">
          {event?.time && formatTime(event.time, { onlyTime: true })}
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
          uri:
            event?.gallery?.[0] ??
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3DNasCvfOLMIxJyQtbNq7EfLkWnMazHE9xw&s",
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
              {event?.title}
            </Text>
            <ContainerIcon
              icon={isFavorited ? "bookmark" : "bookmark-outline"}
              iconType="Ionicons"
              iconSize={30}
              iconColor={
                isFavorited ? colors.secondary.blue : colors.primary.black
              }
              handleClick={() =>
                toggleInteraction.mutate({
                  eventId: id,
                  interactionType: "favorite",
                })
              }
            />
          </View>

          {/* Interaction Stats */}
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <ContainerIcon
                icon="heart"
                iconType="Ionicons"
                iconSize={16}
                iconColor={colors.secondary.red}
                interactive={false}
              />
              <Text variant="interMedium" className="text-sm">
                {eventInteractions?.likes || 0}
              </Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center gap-1"
              onPress={() => setShowAttendeesModal(true)}
            >
              <ContainerIcon
                icon="people"
                iconType="Ionicons"
                iconSize={16}
                iconColor={colors.secondary.blue}
                interactive={false}
              />
              <Text variant="interMedium" className="text-sm">
                {eventInteractions?.attendees || 0} going
              </Text>
            </TouchableOpacity>
            {friendsAttending.length > 0 && (
              <Text
                variant="interMedium"
                className="text-sm text-primary-black"
              >
                • {friendsAttending.length}{" "}
                {friendsAttending.length === 1 ? "friend" : "friends"} attending
              </Text>
            )}
          </View>

          {/* Tags */}
          <View className="flex-row items-center flex-wrap gap-1">
            {event?.tags?.map((t) => (
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
            {event?.description}
          </Text>
          <TouchableOpacity className="flex-row border border-black p-1 rounded-full items-center justify-between gap-2">
            <View className="ml-6 flex-1">
              <Text variant="interBold" className="text-sm" numberOfLines={1}>
                {event?.location?.title} - {event?.location?.address}
              </Text>
              <Text variant="interSemiBold">
                {event?.location?.city}, {event?.location?.country}
              </Text>
            </View>
            <ContainerIcon
              icon="map-marker"
              iconType="MaterialCommunityIcons"
              className="bg-black w-14 h-14"
              iconColor={colors.primary.white}
              interactive={false}
            />
          </TouchableOpacity>

          <Section label="Gallery" className="px-0" gap={16}>
            {/*
            <StaggeredList
              data={event?.gallery ?? []}
              animationType={"FADE_IN_FAST"}
              contentContainerStyle={{ flex: 1 }}
              //contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) =>
                renderChildren(item, () => handleClick(item))
              }
              //LoadingView={<ActivityIndicator color={"black"} size={"large"} />}
            />
                                */}
            <FlashList
              contentContainerClassName="gap-5"
              horizontal
              showsHorizontalScrollIndicator={false}
              data={event?.gallery}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/images-preview",
                      params: { uri: item },
                    })
                  }
                >
                  <Image
                    source={{
                      uri: item,
                    }}
                    className="rounded-2xl w-[160px] mr-4"
                    height={120}
                  />
                </TouchableOpacity>
              )}
            />
          </Section>
          <Section label="You may also like" className="px-0" gap={16}>
            <FlashList
              contentContainerClassName="gap-5"
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[1, 2, 3]}
              renderItem={({ item }) => (
                <EventCard
                  className="rounded-2xl w-[280px] mr-4"
                  imageHeight={200}
                  event={event}
                />
              )}
            />
          </Section>
        </View>
      </ScrollView>
      <View
        className="absolute bottom-0 left-0 right-0 shadow-3xl shadow-black bg-neutral-100 px-5 pt-5 z-50 rounded-t-[30px]"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text variant="caption">Price</Text>
            <Text variant="interExtraBold" className="text-lg">
              {event?.price ?? 0} POL
            </Text>
          </View>
          <TouchableOpacity
            className={cn("px-6 py-3 rounded-full border-2 border-black")}
            onPress={() =>
              toggleInteraction.mutate({
                eventId: id,
                interactionType: "attend",
              })
            }
            disabled={hasBlockchainTicket}
          >
            <Text variant="interBold" className={cn("text-sm text-black")}>
              {hasBlockchainTicket
                ? "Going ✓ (Ticket Owned)"
                : isAttending
                  ? "Going ✓"
                  : "I'm Going"}
            </Text>
          </TouchableOpacity>
        </View>
        <Button
          name={
            eventHasPassed
              ? "Event Has Passed"
              : hasBlockchainTicket
                ? "View Tickets"
                : "Buy a ticket"
          }
          className={cn(
            "px-12 py-4 rounded-full w-full",
            eventHasPassed ? "bg-gray-400" : "bg-black"
          )}
          textClassName="tracking-widest"
          disabled={eventHasPassed && !hasBlockchainTicket}
          onPress={() => {
            if (!event?.id) {
              Alert.alert("Error", "Event not found");
              return;
            }
            if (hasBlockchainTicket) {
              // Navigate to profile to view tickets (allow even if event passed)
              router.push("/(tabs)/profile");
            } else if (!eventHasPassed) {
              router.push({
                pathname: "/events/ticketdetails",
                params: { id: event.id },
              });
            }
          }}
        />
      </View>

      {/* Attendees Modal */}
      <AttendeesModal
        visible={showAttendeesModal}
        onClose={() => setShowAttendeesModal(false)}
        attendees={attendees}
        friendsAttending={friendsAttending}
      />
    </View>
  );
}

const renderChildren = (item: string, handleClick: () => void) => {
  return (
    <TouchableOpacity
      style={getChildrenStyle()}
      key={item}
      onPress={handleClick}
    >
      <Image
        source={{
          uri: item,
        }}
        className="rounded-2xl h-full w-full"
      />
    </TouchableOpacity>
  );
};

const getChildrenStyle = () => {
  return {
    width: (width - 20) / 2,
    height: Number(Math.random() * 20 + 12) * 10,
    backgroundColor: "gray",
    margin: 4,
    borderRadius: 18,
  };
};
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
