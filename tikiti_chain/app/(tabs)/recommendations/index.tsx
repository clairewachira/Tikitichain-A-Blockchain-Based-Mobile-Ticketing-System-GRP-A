import Button from "@/components/ui/Button";
import { RecommendationFilters } from "@/components/ui/RecommendationFilters";
import { RecommendationList } from "@/components/ui/RecommendationList";
import {
  useSimilarUsers,
  useTrendingEvents,
} from "@/hooks/recommendation/useRecommendations";
import { Event } from "@/types/event";
import { RecommendationRequest } from "@/types/recommendation";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecommendationsScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<RecommendationRequest>>({
    limit: 20,
  });

  const { data: trendingEvents } = useTrendingEvents(5);
  const { data: similarUsers } = useSimilarUsers(5);

  const handleEventPress = (event: Event) => {
    router.push(`/events/event?id=${event.id}`);
  };

  const handleFiltersChange = (newFilters: Partial<RecommendationRequest>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    // Refresh logic is handled by the RecommendationList component
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-light_gray">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">For You</Text>
            <Text className="text-sm text-gray-600">
              AI-powered recommendations
            </Text>
          </View>
          <Button
            name={showFilters ? "Hide" : "Filter"}
            onPress={() => setShowFilters(!showFilters)}
            className="bg-primary-black px-4 py-2 rounded-full"
          />
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <RecommendationFilters
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      )}

      {/* Quick Stats */}
      <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Quick Stats
        </Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-lg font-bold text-primary-black">
              {trendingEvents?.length || 0}
            </Text>
            <Text className="text-xs text-gray-600">Trending</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-green-600">
              {similarUsers?.length || 0}
            </Text>
            <Text className="text-xs text-gray-600">Similar Users</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-purple-600">AI</Text>
            <Text className="text-xs text-gray-600">Powered</Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View className="flex-1 mt-4">
        <RecommendationList
          request={filters as RecommendationRequest}
          onEventPress={handleEventPress}
          onRefresh={handleRefresh}
        />
      </View>
    </SafeAreaView>
  );
}
