import { useRecommendations, useTrackInteraction } from '@/hooks/recommendation/useRecommendations';
import { Event } from '@/types/event';
import { RecommendationRequest } from '@/types/recommendation';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { RecommendationCard } from './RecommendationCard';

interface RecommendationListProps {
  request: RecommendationRequest;
  onEventPress: (event: Event) => void;
  onRefresh?: () => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  request,
  onEventPress,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    data: recommendations, 
    isLoading, 
    error, 
    refetch 
  } = useRecommendations(request);
  
  const trackInteraction = useTrackInteraction();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    onRefresh?.();
    setRefreshing(false);
  };

  const handleLike = async (event: Event) => {
    try {
      await trackInteraction.mutateAsync({
        event_id: event.id,
        interaction_type: 'like',
        rating: 4
      });
    } catch (error) {
      console.error('Failed to like event:', error);
    }
  };

  const handleShare = async (event: Event) => {
    try {
      await trackInteraction.mutateAsync({
        event_id: event.id,
        interaction_type: 'share'
      });
    } catch (error) {
      console.error('Failed to share event:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-2">Loading recommendations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-red-600 text-center mb-4">
          Failed to load recommendations
        </Text>
        <Text className="text-gray-600 text-center text-sm">
          {error.message}
        </Text>
      </View>
    );
  }

  if (!recommendations?.recommendations?.length) {
    return (
      <View className="flex-1 justify-center items-center py-8">
        <Text className="text-gray-600 text-center mb-2">
          No recommendations available
        </Text>
        <Text className="text-gray-500 text-center text-sm">
          Try adjusting your preferences or check back later
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#3B82F6']}
        />
      }
    >
      <View className="py-4">
        <View className="px-4 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-1">
            Recommended for You
          </Text>
          <Text className="text-sm text-gray-600">
            {recommendations.recommendations.length} personalized recommendations
          </Text>
        </View>

        {recommendations.recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.event.id}-${index}`}
            recommendation={recommendation}
            onPress={onEventPress}
            onLike={handleLike}
            onShare={handleShare}
          />
        ))}

        {/* Model Info */}
        <View className="mx-4 mt-6 p-3 bg-gray-50 rounded-lg">
          <Text className="text-xs text-gray-500 text-center">
            Powered by AI • Last updated: {new Date(recommendations.generated_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

