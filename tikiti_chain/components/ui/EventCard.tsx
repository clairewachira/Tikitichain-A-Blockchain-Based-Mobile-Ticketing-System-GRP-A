import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { formatTime, hexToRgba } from "@/utils/functions";
import { LinearGradient } from "expo-linear-gradient";
import { Image, TouchableOpacity, View } from "react-native";
import { Text } from "./Text";
import { cn } from "@/utils/cn";
import ContainerIcon from "./ContainerIcon";
import { Event } from "@/types/event";
import { useToggleInteraction, useUserInteractions } from "@/hooks/interactions/useInteractions";

type EventCardProps = {
  className: string;
  imageClassName?: string;
  imageHeight: number;
  type?: "description" | "location";
  event: Event;
  showInteractions?: boolean;
};
export default function EventCard({
  className,
  imageClassName,
  imageHeight,
  type = "location",
  event,
  showInteractions = true,
}: EventCardProps) {
  const router = useSafeRouter();
  const { data: userInteractions = [] } = useUserInteractions(event?.id);
  const toggleInteraction = useToggleInteraction();

  const isLiked = userInteractions.includes("like");
  const isFavorited = userInteractions.includes("favorite");

  const handleInteraction = (e: any, interactionType: "like" | "favorite") => {
    e.stopPropagation();
    toggleInteraction.mutate({ eventId: event.id, interactionType });
  };

  return (
    <TouchableOpacity
      className={className}
      onPress={() =>
        router.push({ pathname: "/events/event", params: { id: event?.id } })
      }
    >
      <LinearGradient
        colors={[colors.primary.black, hexToRgba(colors.primary.black, 0.1)]}
        style={{
          borderRadius: 16,
          position: "absolute",
          zIndex: 20,
          height: "100%",
          padding: 16,
          justifyContent: "space-between",
        }}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        className="bg-black/30 w-full rounded-2xl"
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-row gap-2">
            <Text
              variant="interExtraBold"
              className="rounded-full px-2 py-1 bg-white text-xs text-black"
            >
              {event?.time ? formatTime(event?.time) : ""}
            </Text>
            <Text
              variant="interExtraBold"
              className="rounded-full px-2 py-1 bg-white text-xs text-black"
            >
              {event?.price} POL
            </Text>
          </View>
          {showInteractions && (
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={(e) => handleInteraction(e, "like")}>
                <ContainerIcon
                  icon={isLiked ? "heart" : "heart-outline"}
                  iconType="Ionicons"
                  iconSize={20}
                  iconColor={isLiked ? colors.secondary.red : colors.primary.white}
                  className="p-1.5 bg-black/50"
                  interactive={false}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={(e) => handleInteraction(e, "favorite")}>
                <ContainerIcon
                  icon={isFavorited ? "bookmark" : "bookmark-outline"}
                  iconType="Ionicons"
                  iconSize={20}
                  iconColor={colors.primary.white}
                  className="p-1.5 bg-black/50"
                  interactive={false}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View className="gap-2">
          <Text variant="subheading" className="text-2xl text-primary-gray">
            {event?.title}
          </Text>
          {type === "description" ? (
            <Text
              variant="caption"
              className="text-primary-gray"
              numberOfLines={3}
            >
              {event?.description}
            </Text>
          ) : (
            <View className="flex-row items-center gap-2">
              <ContainerIcon
                icon="map-marker"
                iconType="MaterialCommunityIcons"
                iconSize={14}
                iconColor={colors.primary.white}
                interactive={false}
              />
              <Text variant="caption" className="text-primary-gray">
                {event?.location?.city}, {event?.location?.country}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      <Image
        source={{
          uri:
            event?.gallery?.[0] ??
            "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?cs=srgb&dl=pexels-joshsorenson-976866.jpg&fm=jpg",
        }}
        className={cn("rounded-2xl w-full", imageClassName)}
        height={imageHeight}
      />
    </TouchableOpacity>
  );
}
