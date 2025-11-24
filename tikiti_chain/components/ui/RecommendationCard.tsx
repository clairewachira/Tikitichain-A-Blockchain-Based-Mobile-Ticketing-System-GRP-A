import { Event } from '@/types/event';
import { RecommendationResult } from '@/types/recommendation';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface RecommendationCardProps {
  recommendation: RecommendationResult;
  onPress: (event: Event) => void;
  onLike: (event: Event) => void;
  onShare: (event: Event) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onPress,
  onLike,
  onShare
}) => {
  const { event, score, confidence, reasons } = recommendation;

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreText = (score: number) => {
    if (score >= 4) return 'Highly Recommended';
    if (score >= 3) return 'Recommended';
    return 'Maybe';
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      className="bg-white rounded-lg shadow-md p-4 mb-3 mx-4"
    >
      {/* Event Image */}
      <View className="relative mb-3">
        <Image
          source={{ uri: event.gallery[0] || 'https://via.placeholder.com/300x200' }}
          className="w-full h-48 rounded-lg"
          resizeMode="cover"
        />
        
        {/* Score Badge */}
        <View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full">
          <Text className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {score.toFixed(1)}/5
          </Text>
        </View>
      </View>

      {/* Event Info */}
      <View className="mb-3">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {event.title}
        </Text>
        <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
          {event.description}
        </Text>
        
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-primary-black">
            ${event.price}
          </Text>
          <Text className="text-sm text-gray-500">
            {event.category}
          </Text>
        </View>
      </View>

      {/* Recommendation Info */}
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <Text className="text-sm font-semibold text-gray-700">
            {getScoreText(score)}
          </Text>
          <View className="ml-2 bg-gray-200 rounded-full px-2 py-1">
            <Text className="text-xs text-gray-600">
              {Math.round(confidence * 100)}% confidence
            </Text>
          </View>
        </View>

        {/* Reasons */}
        <View className="mb-2">
          <Text className="text-sm text-gray-600 mb-1">Why you might like this:</Text>
          {reasons.slice(0, 2).map((reason, index) => (
            <Text key={index} className="text-xs text-gray-500 ml-2">
              • {reason}
            </Text>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => onLike(event)}
          className="flex-row items-center bg-red-50 px-3 py-2 rounded-full"
        >
          <Text className="text-red-600 mr-1">❤️</Text>
          <Text className="text-red-600 text-sm font-medium">Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onShare(event)}
          className="flex-row items-center bg-primary-light_gray px-3 py-2 rounded-full"
        >
          <Text className="text-primary-dark_gray mr-1">📤</Text>
          <Text className="text-primary-dark_gray text-sm font-medium">Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onPress(event)}
          className="bg-primary-black px-4 py-2 rounded-full"
        >
          <Text className="text-white text-sm font-medium">View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

