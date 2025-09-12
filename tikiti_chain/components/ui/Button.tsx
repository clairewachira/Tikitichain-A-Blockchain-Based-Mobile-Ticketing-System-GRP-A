import { Text, TouchableOpacity } from "react-native";
import React from "react";
import { cn } from "@/utils/cn";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Button = ({
  name,
  onPress,
  className,
  textClassName,
  onPressOut,
  onPressIn,
  onLongPress,
  icon,
  disabled = false,
  leading,
  bottom,
}: {
  name: string;
  leading?: any;
  icon?: any;
  onPress?: () => unknown;
  onPressOut?: () => unknown;
  onPressIn?: () => unknown;
  onLongPress?: () => unknown;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
  bottom?: number;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      style={{ bottom: bottom && insets.bottom + bottom }}
      disabled={disabled}
      onPress={onPress}
      onPressOut={onPressOut}
      onPressIn={onPressIn}
      onLongPress={onLongPress}
      className={cn(
        "flex-row rounded-[12px] items-center justify-center",
        className,
      )}
    >
      {leading}
      <Text className={cn(`text-white font-interSemiBold`, textClassName)}>
        {name}
      </Text>
      {icon}
    </TouchableOpacity>
  );
};

export default Button;
