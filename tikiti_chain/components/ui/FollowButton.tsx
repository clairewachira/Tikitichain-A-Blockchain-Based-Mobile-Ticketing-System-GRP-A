import { TouchableOpacity, ActivityIndicator, View } from "react-native";
import { Text } from "./Text";
import { useToggleFollow, useIsFollowing } from "@/hooks/interactions/useSocialConnections";
import { colors } from "@/constants/colors";
import { cn } from "@/utils/cn";

type FollowButtonProps = {
  userId: string;
  variant?: "default" | "compact";
  className?: string;
};

export default function FollowButton({
  userId,
  variant = "default",
  className
}: FollowButtonProps) {
  const { data: isFollowing, isLoading: isCheckingFollow } = useIsFollowing(userId);
  const toggleFollow = useToggleFollow();

  const handleToggleFollow = () => {
    toggleFollow.mutate({ userId });
  };

  if (isCheckingFollow) {
    return (
      <View className={cn(
        "items-center justify-center rounded-full",
        variant === "compact" ? "px-3 py-1" : "px-4 py-2",
        className
      )}>
        <ActivityIndicator size="small" color={colors.primary.black} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleToggleFollow}
      disabled={toggleFollow.isPending}
      className={cn(
        "rounded-full border items-center justify-center",
        variant === "compact" ? "px-3 py-1" : "px-4 py-2",
        isFollowing
          ? "bg-primary-light_gray border-primary-dark_gray"
          : "bg-primary-black border-primary-black",
        className
      )}
    >
      {toggleFollow.isPending ? (
        <ActivityIndicator size="small" color={isFollowing ? colors.primary.black : colors.primary.white} />
      ) : (
        <Text
          variant="interBold"
          className={cn(
            variant === "compact" ? "text-xs" : "text-sm",
            isFollowing ? "text-primary-black" : "text-white"
          )}
        >
          {isFollowing ? "Following" : "Follow"}
        </Text>
      )}
    </TouchableOpacity>
  );
}
