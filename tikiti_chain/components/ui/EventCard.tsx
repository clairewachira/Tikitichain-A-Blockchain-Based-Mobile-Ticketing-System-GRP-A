import { colors } from "@/constants/colors";
import { useSafeRouter } from "@/hooks/navigation/router";
import { hexToRgba } from "@/utils/functions";
import { LinearGradient } from "expo-linear-gradient";
import { Image, TouchableOpacity, View } from "react-native";
import { Text } from "./Text";
import { cn } from "@/utils/cn";
import ContainerIcon from "./ContainerIcon";

type EventCardProps = {
  className: string;
  imageClassName?: string;
  imageHeight: number;
  type?: "description" | "location";
};
export default function EventCard({
  className,
  imageClassName,
  imageHeight,
  type = "location",
}: EventCardProps) {
  const router = useSafeRouter();
  return (
    <TouchableOpacity
      className={className}
      onPress={() => router.push("/events/event")}
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
        className="bg-black/50 w-full rounded-2xl"
      >
        <View className="flex-row gap-6">
          <Text
            variant="interExtraBold"
            className="rounded-full px-2 py-1 bg-white text-xs text-black"
          >
            Dec, 7
          </Text>
          <Text
            variant="interExtraBold"
            className="rounded-full px-2 py-1 bg-white text-xs text-black"
          >
            0.02 BTC
          </Text>
        </View>
        <View className="gap-2">
          <Text variant="subheading" className="text-2xl text-primary-gray">
            Hanya Yanagihara book presentation
          </Text>
          {type === "description" ? (
            <Text
              variant="caption"
              className="text-primary-gray"
              numberOfLines={3}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. In ligula
              lorem, ultrices id mauris quis, consectetur egestas massa. Nunc at
              tempus risus, ut faucibus nunc. Ut condimentum turpis et viverra
              lacinia. In ipsum ante, convallis vel purus eu, sagittis maximus
              mauris. Fusce ultricies, risus et feugiat feugiat, neque neque
              fermentum lorem, ac dignissim nunc odio quis risus. Aenean
              fermentum molestie velit eget venenatis. Duis ac velit enim.
              Maecenas et pellentesque sapien.
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
                Nairobi, Kenya
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      <Image
        source={{
          uri: "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?cs=srgb&dl=pexels-joshsorenson-976866.jpg&fm=jpg",
        }}
        className={cn("rounded-2xl w-full", imageClassName)}
        height={imageHeight}
      />
    </TouchableOpacity>
  );
}
