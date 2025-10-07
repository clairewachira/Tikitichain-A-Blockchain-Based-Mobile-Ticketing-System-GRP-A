import { cn } from "@/utils/cn";
import { PropsWithChildren } from "react";
import { View } from "react-native";
import { Text } from "./Text";
import Button from "./Button";
import ContainerIcon from "./ContainerIcon";
import { colors } from "@/constants/colors";

export default function Section({
  label,
  children,
  className,
  seeall,
  gap,
  padding = true,
}: PropsWithChildren<{
  label: string;
  className?: string;
  seeall?: boolean;
  gap?: number;
  padding?: boolean;
}>) {
  return (
    <View className={cn("w-full", className)} style={{ gap }}>
      <View
        className={cn(
          "flex-row items-center justify-between",
          padding && "px-4",
        )}
      >
        <Text variant="subheading" className="text-black">
          {label}
        </Text>
        {seeall && (
          <Button
            name="See all"
            icon={
              <ContainerIcon
                icon="chevron-forward"
                iconType="Ionicons"
                iconColor={colors.primary.black}
                iconSize={16}
                interactive={false}
              />
            }
            className="gap-1"
            textClassName="text-black"
          />
        )}
      </View>
      {children}
    </View>
  );
}
