import React from "react";
import { TouchableOpacity, View } from "react-native";
import Toast, { BaseToastProps } from "react-native-toast-message";
import ContainerIcon from "./ContainerIcon";
import { colors } from "@/constants/colors";
import { Text } from "./Text";

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
}

const toastConfig = {
  error: ({ text1, text2, onPress }: CustomToastProps) => (
    <TouchableOpacity
      className="flex-row gap-4 bg-[##fff5f3] border border-red p-4 rounded-xl w-[80%]"
      onPress={onPress}
    >
      <ContainerIcon
        iconType="MaterialIcons"
        icon="close"
        className="h-6 w-6 rounded-md bg-secondary-red"
        iconColor={colors.primary.white}
        iconSize={12}
        interactive={false}
      />
      <View className="flex-row items-center justify-between flex-1 self-center">
        <View className="gap-2 flex-1">
          {text1 && (
            <Text variant="interSemiBold" className="text-wrap">
              {text1}
            </Text>
          )}
          {text2 && (
            <Text variant="interSemiBold" className="text-xs">
              {text2}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onPress}
          className="bg-white rounded-xl items-center justify-center h-10 px-3 border border-neutral-neutral_400"
        >
          <Text className="text-[10px] text-neutral-neutral_400">
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ),
  success: ({ text1, text2, onPress }: CustomToastProps) => (
    <TouchableOpacity
      className="flex-row gap-4 bg-[#f6fffa] border border-green p-4 rounded-xl w-[80%]"
      onPress={onPress}
    >
      <ContainerIcon
        iconType="MaterialIcons"
        icon="done"
        className="h-6 w-6 rounded-md bg-secondary-green"
        iconColor={colors.primary.white}
        iconSize={12}
        interactive={false}
      />

      <View className="gap-2 flex-1">
        {text1 && (
          <Text variant="interSemiBold" className="text-wrap">
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            variant="interSemiBold"
            className="text-xs flex-shrink text-wrap"
          >
            {text2}
          </Text>
        )}
      </View>
      <ContainerIcon
        iconType="MaterialIcons"
        icon="close"
        className="absolute top-0 right-0 m-4"
        iconColor={colors.primary.white}
        iconSize={20}
        handleClick={Toast.hide}
      />
    </TouchableOpacity>
  ),
  warning: ({ text1, text2, onPress }: CustomToastProps) => (
    <TouchableOpacity
      className="flex-row gap-4 bg-yellow-50 border border-secondary-yellow p-4 rounded-xl w-[80%]"
      onPress={onPress}
    >
      <ContainerIcon
        iconType="MaterialIcons"
        icon="done"
        className="h-6 w-6 rounded-md bg-secondary-yellow"
        iconColor={colors.primary.white}
        iconSize={12}
        interactive={false}
      />
      <View className="gap-2 flex-1">
        {text1 && (
          <Text variant="interSemiBold" className="text-wrap">
            {text1}
          </Text>
        )}
        {text2 && (
          <Text
            variant="interSemiBold"
            className="text-xs flex-shrink text-wrap"
          >
            {text2}
          </Text>
        )}
      </View>
      <ContainerIcon
        iconType="MaterialIcons"
        icon="close"
        className="absolute top-0 right-0 m-4"
        iconColor={colors.secondary.purple}
        iconSize={20}
        handleClick={Toast.hide}
      />
    </TouchableOpacity>
  ),
};

export default toastConfig;
