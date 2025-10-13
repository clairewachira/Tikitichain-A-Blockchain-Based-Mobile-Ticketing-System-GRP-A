import React, { Dispatch, SetStateAction } from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FlatList } from "react-native-gesture-handler";
import { Text } from "./Text";
import ContainerIcon from "./ContainerIcon";
import { colors } from "@/constants/colors";

interface SearchHistoryProps {
  searchHistory: string[];
  removeSearchItem: (item: string) => void;
  clearSearchHistory: () => void;
  setSearchText: Dispatch<SetStateAction<string>>;
  setShowHistory: Dispatch<SetStateAction<boolean>>;
}

export default function SearchHistory({
  searchHistory,
  removeSearchItem,
  clearSearchHistory,
  setSearchText,
  setShowHistory,
}: SearchHistoryProps) {
  return (
    <View className="bg-primary-light_gray rounded-xl p-3">
      <FlatList
        data={searchHistory}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row gap-3 items-center py-2 border-b border-gray-200"
            onPress={() => {
              setSearchText(item);
              setShowHistory(false);
            }}
          >
            <Image
              source={{
                uri: "https://images.pexels.com/photos/976866/pexels-photo-976866.jpeg?cs=srgb&dl=pexels-joshsorenson-976866.jpg&fm=jpg",
              }}
              className="w-14 h-14 rounded-xl"
            />
            <View className="gap-1 flex-1">
              <Text variant="interMedium">A conversation with Donna Tartt</Text>
              <View className="flex-row items-center gap-2">
                <ContainerIcon
                  icon="map-marker"
                  iconType="MaterialCommunityIcons"
                  iconSize={14}
                  iconColor={colors.primary.black}
                  interactive={false}
                />
                <Text variant="caption" className="text-primary-black">
                  Nairobi, Kenya
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeSearchItem(item)}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View className="flex-row justify-between items-center mb-3">
            <Text variant="subheading" className="text-2xl">
              Recents
            </Text>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text className="text-gray-600 font-bold">Clear All</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-3">
            No recent searches
          </Text>
        }
      />
    </View>
  );
}
