import { RecommendationRequest } from "@/types/recommendation";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface RecommendationFiltersProps {
  onFiltersChange: (filters: Partial<RecommendationRequest>) => void;
  initialFilters?: Partial<RecommendationRequest>;
}

export const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.categories || [],
  );
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters.price_range || [0, 1000],
  );

  const categories = [
    "music",
    "sports",
    "art",
    "technology",
    "food",
    "education",
    "entertainment",
  ];

  const priceRanges = [
    { label: "Free", value: [0, 0] },
    { label: "Under $25", value: [0, 25] },
    { label: "Under $50", value: [0, 50] },
    { label: "Under $100", value: [0, 100] },
    { label: "Under $200", value: [0, 200] },
    { label: "Any Price", value: [0, 1000] },
  ];

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    onFiltersChange({
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handlePriceRangeSelect = (range: [number, number]) => {
    setPriceRange(range);
    onFiltersChange({ price_range: range });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    onFiltersChange({});
  };

  return (
    <View className="bg-white p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-gray-900">Filters</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text className="text-primary-black text-sm font-medium">
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-3">
          Categories
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryToggle(category)}
                className={`px-4 py-2 rounded-full border ${
                  selectedCategories.includes(category)
                    ? "bg-primary-black border-primary-black"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategories.includes(category)
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Price Range */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-3">
          Price Range
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {priceRanges.map((range, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handlePriceRangeSelect(range.value)}
                className={`px-4 py-2 rounded-full border ${
                  priceRange[0] === range.value[0] &&
                  priceRange[1] === range.value[1]
                    ? "bg-primary-black border-primary-black"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    priceRange[0] === range.value[0] &&
                    priceRange[1] === range.value[1]
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Active Filters Summary */}
      {(selectedCategories.length > 0 || priceRange[1] < 1000) && (
        <View className="p-3 rounded-lg">
          <Text className="text-sm font-medium text-primary-black mb-2">
            Active Filters:
          </Text>
          {selectedCategories.length > 0 && (
            <Text className="text-xs text-primary-dark_gray">
              Categories: {selectedCategories.join(", ")}
            </Text>
          )}
          {priceRange[1] < 1000 && (
            <Text className="text-xs text-primary-dark_gray">
              Price: ${priceRange[0]} - ${priceRange[1]}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
