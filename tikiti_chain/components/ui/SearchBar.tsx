import { colors } from "@/constants/colors";
import { cn } from "@/utils/cn";
import { PropsWithChildren } from "react";
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from "react-native";
type SearchBarProps = {
  className?: string;
  placholder?: string;
  bgColor?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: (
    e: NativeSyntheticEvent<TextInputSubmitEditingEventData>,
  ) => void;
};
export default function SearchBar({
  children,
  className,
  placholder,
  bgColor,
  value,
  onChangeText,
  onSubmitEditing,
}: PropsWithChildren<SearchBarProps>) {
  return (
    <View className={`justify-center ${className}`}>
      <TextInput
        className={cn(
          `rounded-2xl py-5 px-6 font-interMedium`,
          bgColor ?? `bg-primary-gray`,
        )}
        placeholder={placholder ?? "Search"}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.primary.dark_gray}
        onSubmitEditing={onSubmitEditing}
      />
      {children}
    </View>
  );
}
