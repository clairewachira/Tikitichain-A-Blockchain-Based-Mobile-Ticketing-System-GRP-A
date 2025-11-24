import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/colors";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = "Loading...",
  fullScreen = true,
}: LoadingScreenProps) {
  // Animation values for ticket stub animation
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Staggered pulse animation for ticket stubs
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      false,
    );

    scale2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      ),
    );

    scale3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity.value,
  }));

  const Container = fullScreen ? SafeAreaView : View;

  return (
    <Container
      className={`flex-1 items-center justify-center bg-primary-light_gray ${
        fullScreen ? "px-4" : ""
      }`}
    >
      <View className="items-center gap-6">
        {/* Animated Ticket Stubs */}
        <View className="flex-row items-center gap-4">
          <Animated.View
            style={animatedStyle1}
            className="w-16 h-24 bg-black rounded-2xl items-center justify-center"
          >
            <View className="gap-1">
              {[...Array(8)].map((_, i) => (
                <View key={i} className="w-10 h-1 bg-white rounded-full" />
              ))}
            </View>
          </Animated.View>

          <Animated.View
            style={animatedStyle2}
            className="w-16 h-24 bg-secondary-indigo rounded-2xl items-center justify-center"
          >
            <View className="gap-1">
              {[...Array(8)].map((_, i) => (
                <View key={i} className="w-10 h-1 bg-white rounded-full" />
              ))}
            </View>
          </Animated.View>

          <Animated.View
            style={animatedStyle3}
            className="w-16 h-24 bg-primary-black rounded-2xl items-center justify-center"
          >
            <View className="gap-1">
              {[...Array(8)].map((_, i) => (
                <View key={i} className="w-10 h-1 bg-white rounded-full" />
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Loading Spinner */}
        <ActivityIndicator size="large" color={colors.primary.black} />

        {/* Loading Text */}
        <Text variant="interBold" className="text-xl text-center">
          {message}
        </Text>
      </View>
    </Container>
  );
}

// Compact version for inline use
export function LoadingSpinner({
  message,
  size = "large",
}: {
  message?: string;
  size?: "small" | "large";
}) {
  return (
    <View className="items-center justify-center py-8 gap-3">
      <ActivityIndicator size={size} color={colors.primary.black} />
      {message && (
        <Text variant="interMedium" className="text-gray-600">
          {message}
        </Text>
      )}
    </View>
  );
}
