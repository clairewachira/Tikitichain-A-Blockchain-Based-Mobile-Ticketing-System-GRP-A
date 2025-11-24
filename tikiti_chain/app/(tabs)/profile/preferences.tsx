import { useUpdateUserPreferences, useUserPreferences } from '@/hooks/recommendation/useRecommendations';
import { UserPreferences } from '@/types/recommendation';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PreferencesScreen() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();
  
  const [formData, setFormData] = useState<Partial<UserPreferences>>({
    category_preferences: {},
    price_range: [0, 1000],
    location_preferences: {
      latitude: 0,
      longitude: 0,
      radius_km: 50
    },
    time_preferences: {
      preferred_days: [0, 1, 2, 3, 4, 5, 6], // All days
      preferred_hours: [9, 22] // 9 AM to 10 PM
    }
  });

  const interestCategories = [
    {
      name: "Education and Development",
      interests: ["Book Launches", "Photography", "History Lectures", "Literature",
                  "Workshops", "Startup Meetups", "Poetry", "Language Exchanges"]
    },
    {
      name: "Culture and Entertainment",
      interests: ["Art Exhibitions", "Music", "Theater Performances",
                  "Cultural Festivals", "Dance Shows"]
    },
    {
      name: "Food and Drink",
      interests: ["Food Festivals", "Food and Drinks", "Wine Tastings", "Tea Ceremonies"]
    },
    {
      name: "Sports and Wellness",
      interests: ["Basketball Tournaments", "Football Matches", "Marathons",
                  "Golf Events", "Tennis", "Swimming", "Cycling Races", "Fitness Challenges"]
    },
    {
      name: "Technology and Innovation",
      interests: ["Tech Conferences", "Blockchain & Crypto", "App Development",
                  "AI & Machine Learning"]
    },
    {
      name: "Business and Professional",
      interests: ["Networking Events", "Startup Events", "Career Development",
                  "Finance & Investment"]
    },
    {
      name: "Entertainment",
      interests: ["Gaming Tournaments", "Comedy Shows", "Movie Screenings"]
    },
    {
      name: "Health and Wellness",
      interests: ["Yoga & Meditation", "Wellness Retreats", "Mental Health"]
    },
    {
      name: "Shopping and Markets",
      interests: ["Markets & Bazaars", "Pop-Up Shops", "Artisan Crafts"]
    },
    {
      name: "Family and Kids",
      interests: ["Family Events", "Kids Activities", "Children's Shows"]
    },
    {
      name: "Fashion and Beauty",
      interests: ["Fashion Shows", "Beauty Workshops"]
    },
    {
      name: "Community and Charity",
      interests: ["Charity Events", "Volunteer Work", "Community Gatherings"]
    }
  ];

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const currentPrefs = { ...prev.category_preferences };

      // If interest is already selected, remove it (set to 0)
      // Otherwise, add it with high preference (5)
      if (currentPrefs[interest]) {
        delete currentPrefs[interest];
      } else {
        currentPrefs[interest] = 5;
      }

      return {
        ...prev,
        category_preferences: currentPrefs
      };
    });
  };

  const isInterestSelected = (interest: string) => {
    return (formData.category_preferences?.[interest] || 0) > 0;
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setFormData(prev => ({
      ...prev,
      price_range: [min, max]
    }));
  };

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => {
      const currentDays = prev.time_preferences?.preferred_days || [];
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter(d => d !== dayIndex)
        : [...currentDays, dayIndex];
      
      return {
        ...prev,
        time_preferences: {
          ...prev.time_preferences!,
          preferred_days: newDays
        }
      };
    });
  };

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync(formData);
      Alert.alert('Success', 'Preferences updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Recommendation Preferences
        </Text>

        {/* Interests */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Your Interests
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Tap to select or deselect interests
          </Text>

          {interestCategories.map((category) => (
            <View key={category.name} className="mb-4">
              <Text className="text-base font-medium text-gray-700 mb-2">
                {category.name}
              </Text>
              <View className="flex-row flex-wrap">
                {category.interests.map((interest) => {
                  const selected = isInterestSelected(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      onPress={() => handleInterestToggle(interest)}
                      className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                        selected
                          ? 'bg-black border-black'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Price Range */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Price Range
          </Text>
          <View className="flex-row space-x-2">
            {[
              { label: 'Free', value: [0, 0] },
              { label: 'Under $25', value: [0, 25] },
              { label: 'Under $50', value: [0, 50] },
              { label: 'Under $100', value: [0, 100] },
              { label: 'Any Price', value: [0, 1000] }
            ].map((range) => (
              <TouchableOpacity
                key={range.label}
                onPress={() => handlePriceRangeChange(range.value[0], range.value[1])}
                className={`px-3 py-2 rounded-full border ${
                  formData.price_range?.[0] === range.value[0] &&
                  formData.price_range?.[1] === range.value[1]
                    ? 'bg-primary-black border-primary-black'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    formData.price_range?.[0] === range.value[0] &&
                    formData.price_range?.[1] === range.value[1]
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferred Days */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Preferred Days
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Select days when you're most likely to attend events
          </Text>
          
          <View className="flex-row flex-wrap">
            {days.map((day, index) => (
              <TouchableOpacity
                key={day}
                onPress={() => handleDayToggle(index)}
                className={`mr-2 mb-2 px-3 py-2 rounded-full border ${
                  formData.time_preferences?.preferred_days?.includes(index)
                    ? 'bg-primary-black border-primary-black'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    formData.time_preferences?.preferred_days?.includes(index)
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={updatePreferences.isPending}
          className="bg-primary-black py-4 rounded-lg"
        >
          <Text className="text-white text-center font-semibold text-lg">
            {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


