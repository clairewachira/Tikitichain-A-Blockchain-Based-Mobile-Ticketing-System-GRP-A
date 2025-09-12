import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import React from "react";

export type ContainerIconProps = {
  icon:
    | keyof typeof MaterialIcons.glyphMap
    | keyof typeof MaterialCommunityIcons.glyphMap
    | keyof typeof Ionicons.glyphMap;
  iconType: "MaterialIcons" | "MaterialCommunityIcons" | "Ionicons";
  className?: string;
  iconSize?: number;
  iconColor?: string;
  handleClick?: () => void;
  interactive?: boolean;
};

export default function ContainerIcon({
  className,
  icon,
  iconType,
  handleClick,
  iconSize,
  iconColor,
  interactive = true,
}: ContainerIconProps) {
  const IconComponent =
    iconType === "MaterialIcons"
      ? MaterialIcons
      : iconType === "MaterialCommunityIcons"
        ? MaterialCommunityIcons
        : Ionicons;

  const containerClasses = `rounded-full items-center justify-center ${
    typeof className === "string" ? className : ""
  }`;

  const iconElement = (
    <IconComponent
      name={icon as any}
      color={iconColor || "black"}
      size={iconSize || 24}
    />
  );

  if (interactive) {
    return (
      <TouchableOpacity
        className={containerClasses}
        onPress={handleClick}
        disabled={!interactive}
      >
        {iconElement}
      </TouchableOpacity>
    );
  }

  return <View className={containerClasses}>{iconElement}</View>;
}
