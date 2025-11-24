import { Event } from "./event";

export interface UserInteraction {
  id: string;
  user_id: string;
  event_id: string;
  interaction_type: 'view' | 'like' | 'favorite' | 'purchase' | 'share' | 'attend';
  timestamp: string;
  rating?: number; // 1-5 scale for explicit feedback
  duration?: number; // time spent viewing in seconds
}

export interface UserSocialConnection {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  connection_strength?: number; // 0-1 scale based on interaction frequency
}

export interface UserPreferences {
  id: string;
  user_id: string;
  category_preferences: Record<string, number>; // category -> preference score
  price_range: [number, number];
  location_preferences: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  time_preferences: {
    preferred_days: number[]; // 0-6 (Sunday-Saturday)
    preferred_hours: [number, number]; // [start_hour, end_hour]
  };
  updated_at: string;
}

export interface RecommendationFeatures {
  user_id: string;
  event_id: string;
  features: {
    // User features
    user_age_group: number;
    user_interests: string[];
    user_location: [number, number];
    user_activity_level: number;
    
    // Event features
    event_category: string;
    event_price: number;
    event_location: [number, number];
    event_popularity: number;
    event_time: number; // timestamp
    event_duration: number;
    
    // Interaction features
    similar_users_liked: number;
    friends_attending: number;
    category_match_score: number;
    location_distance: number;
    price_affordability: number;
    time_preference_match: number;
    
    // Social features
    social_influence_score: number;
    friend_recommendation_strength: number;
  };
}

export interface RecommendationResult {
  event: Event;
  score: number;
  confidence: number;
  reasons: string[];
  similar_users: string[];
}

export interface MLModelConfig {
  model_type: 'random_forest' | 'neural_network' | 'collaborative_filtering';
  parameters: {
    n_estimators?: number;
    max_depth?: number;
    min_samples_split?: number;
    learning_rate?: number;
    hidden_layers?: number[];
  };
  training_data_size: number;
  accuracy: number;
  last_trained: string;
}

export interface RecommendationRequest {
  user_id: string;
  limit?: number;
  categories?: string[];
  price_range?: [number, number];
  location?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  time_range?: {
    start: string;
    end: string;
  };
}

export interface RecommendationResponse {
  recommendations: RecommendationResult[];
  model_info: MLModelConfig;
  generated_at: string;
  request_id: string;
}

