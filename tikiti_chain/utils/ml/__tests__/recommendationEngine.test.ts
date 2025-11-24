import { Event } from '@/types/event';
import { UserInteraction, UserPreferences, UserSocialConnection } from '@/types/recommendation';
import { User } from '@/types/user';
import { RecommendationEngine } from '../recommendationEngine';

// Mock data for testing
const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'user1@example.com',
    username: 'user1',
    interests: ['music', 'art'],
    location: { latitude: 40.7128, longitude: -74.0060 }
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    username: 'user2',
    interests: ['sports', 'technology'],
    location: { latitude: 40.7589, longitude: -73.9851 }
  },
  {
    id: 'user3',
    email: 'user3@example.com',
    username: 'user3',
    interests: ['music', 'entertainment'],
    location: { latitude: 40.7505, longitude: -73.9934 }
  }
];

const mockEvents: Event[] = [
  {
    id: 'event1',
    title: 'Music Concert',
    description: 'Amazing music concert',
    location: { latitude: 40.7128, longitude: -74.0060 },
    gallery: ['https://example.com/image1.jpg'],
    price: 50,
    tags: ['music', 'concert'],
    category: 'music',
    time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    duration: 180
  },
  {
    id: 'event2',
    title: 'Tech Conference',
    description: 'Technology conference',
    location: { latitude: 40.7589, longitude: -73.9851 },
    gallery: ['https://example.com/image2.jpg'],
    price: 100,
    tags: ['technology', 'conference'],
    category: 'technology',
    time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    duration: 480
  },
  {
    id: 'event3',
    title: 'Art Exhibition',
    description: 'Modern art exhibition',
    location: { latitude: 40.7505, longitude: -73.9934 },
    gallery: ['https://example.com/image3.jpg'],
    price: 25,
    tags: ['art', 'exhibition'],
    category: 'art',
    time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
    duration: 120
  }
];

const mockInteractions: UserInteraction[] = [
  {
    id: 'int1',
    user_id: 'user1',
    event_id: 'event1',
    interaction_type: 'like',
    timestamp: new Date().toISOString(),
    rating: 4
  },
  {
    id: 'int2',
    user_id: 'user1',
    event_id: 'event3',
    interaction_type: 'favorite',
    timestamp: new Date().toISOString(),
    rating: 5
  },
  {
    id: 'int3',
    user_id: 'user2',
    event_id: 'event2',
    interaction_type: 'purchase',
    timestamp: new Date().toISOString(),
    rating: 5
  },
  {
    id: 'int4',
    user_id: 'user3',
    event_id: 'event1',
    interaction_type: 'like',
    timestamp: new Date().toISOString(),
    rating: 4
  }
];

const mockSocialConnections: UserSocialConnection[] = [
  {
    id: 'conn1',
    follower_id: 'user1',
    following_id: 'user2',
    created_at: new Date().toISOString(),
    connection_strength: 0.8
  },
  {
    id: 'conn2',
    follower_id: 'user1',
    following_id: 'user3',
    created_at: new Date().toISOString(),
    connection_strength: 0.6
  }
];

const mockUserPreferences: UserPreferences[] = [
  {
    id: 'pref1',
    user_id: 'user1',
    category_preferences: { music: 5, art: 4, technology: 2 },
    price_range: [0, 100],
    location_preferences: {
      latitude: 40.7128,
      longitude: -74.0060,
      radius_km: 50
    },
    time_preferences: {
      preferred_days: [5, 6], // Friday, Saturday
      preferred_hours: [19, 23] // 7 PM to 11 PM
    },
    updated_at: new Date().toISOString()
  }
];

describe('RecommendationEngine', () => {
  let engine: RecommendationEngine;

  beforeEach(() => {
    engine = new RecommendationEngine();
  });

  describe('Feature Extraction', () => {
    it('should extract features correctly for a user-event pair', () => {
      const user = mockUsers[0];
      const event = mockEvents[0];
      const preferences = mockUserPreferences[0];

      const features = engine['extractFeatures'](
        user,
        event,
        mockInteractions,
        mockSocialConnections,
        preferences
      );

      expect(features).toBeDefined();
      expect(features.user_activity_level).toBeGreaterThanOrEqual(0);
      expect(features.event_popularity).toBeGreaterThanOrEqual(0);
      expect(features.category_match_score).toBeGreaterThanOrEqual(0);
      expect(features.social_influence_score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate category match score correctly', () => {
      const user = mockUsers[0]; // interests: ['music', 'art']
      const musicEvent = mockEvents[0]; // category: 'music'
      const techEvent = mockEvents[1]; // category: 'technology'
      const preferences = mockUserPreferences[0];

      const musicFeatures = engine['extractFeatures'](
        user,
        musicEvent,
        mockInteractions,
        mockSocialConnections,
        preferences
      );

      const techFeatures = engine['extractFeatures'](
        user,
        techEvent,
        mockInteractions,
        mockSocialConnections,
        preferences
      );

      expect(musicFeatures.category_match_score).toBe(1);
      expect(techFeatures.category_match_score).toBe(0);
    });
  });

  describe('Model Training', () => {
    it('should train the model with interaction data', async () => {
      const modelConfig = await engine.trainModel(
        mockInteractions,
        mockEvents,
        mockUsers,
        mockSocialConnections,
        mockUserPreferences
      );

      expect(modelConfig).toBeDefined();
      expect(modelConfig.model_type).toBe('random_forest');
      expect(modelConfig.training_data_size).toBeGreaterThan(0);
      expect(modelConfig.accuracy).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    beforeEach(async () => {
      // Train the model first
      await engine.trainModel(
        mockInteractions,
        mockEvents,
        mockUsers,
        mockSocialConnections,
        mockUserPreferences
      );
    });

    it('should generate recommendations for a user', async () => {
      const request = {
        user_id: 'user1',
        limit: 5
      };

      const recommendations = await engine.generateRecommendations(
        'user1',
        mockEvents,
        mockUsers,
        mockInteractions,
        mockSocialConnections,
        mockUserPreferences,
        request
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.recommendations).toBeDefined();
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.model_info).toBeDefined();
    });

    it('should filter recommendations by category', async () => {
      const request = {
        user_id: 'user1',
        limit: 5,
        categories: ['music']
      };

      const recommendations = await engine.generateRecommendations(
        'user1',
        mockEvents,
        mockUsers,
        mockInteractions,
        mockSocialConnections,
        mockUserPreferences,
        request
      );

      expect(recommendations.recommendations.every(rec => 
        rec.event.category === 'music'
      )).toBe(true);
    });

    it('should filter recommendations by price range', async () => {
      const request = {
        user_id: 'user1',
        limit: 5,
        price_range: [0, 50] as [number, number]
      };

      const recommendations = await engine.generateRecommendations(
        'user1',
        mockEvents,
        mockUsers,
        mockInteractions,
        mockSocialConnections,
        mockUserPreferences,
        request
      );

      expect(recommendations.recommendations.every(rec => 
        rec.event.price >= 0 && rec.event.price <= 50
      )).toBe(true);
    });

    it('should not recommend events user has already interacted with', async () => {
      const request = {
        user_id: 'user1',
        limit: 5
      };

      const recommendations = await engine.generateRecommendations(
        'user1',
        mockEvents,
        mockUsers,
        mockInteractions,
        mockSocialConnections,
        mockUserPreferences,
        request
      );

      // User1 has interacted with event1 and event3
      const recommendedEventIds = recommendations.recommendations.map(rec => rec.event.id);
      expect(recommendedEventIds).not.toContain('event1');
      expect(recommendedEventIds).not.toContain('event3');
    });
  });

  describe('Random Forest Algorithm', () => {
    it('should create a random forest with multiple trees', () => {
      const forest = engine['model'];
      expect(forest).toBeDefined();
    });

    it('should make predictions with reasonable scores', () => {
      const testFeatures = [1, 0.5, 2, 0.3, 0.8, 0.2, 0.1, 1, 0.1, 0.7, 0.5, 0.3, 0.6];
      const prediction = engine['model'].predict(testFeatures);
      
      expect(prediction).toBeGreaterThanOrEqual(0);
      expect(prediction).toBeLessThanOrEqual(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty interaction data', async () => {
      const emptyInteractions: UserInteraction[] = [];
      
      const modelConfig = await engine.trainModel(
        emptyInteractions,
        mockEvents,
        mockUsers,
        mockSocialConnections,
        mockUserPreferences
      );

      expect(modelConfig).toBeDefined();
      expect(modelConfig.training_data_size).toBe(0);
    });

    it('should handle users with no preferences', async () => {
      const userWithoutPrefs = mockUsers[0];
      const emptyPreferences: UserPreferences[] = [];

      const modelConfig = await engine.trainModel(
        mockInteractions,
        mockEvents,
        mockUsers,
        mockSocialConnections,
        emptyPreferences
      );

      expect(modelConfig).toBeDefined();
    });

    it('should handle events with missing data gracefully', () => {
      const incompleteEvent: Event = {
        id: 'incomplete',
        title: 'Incomplete Event',
        description: '',
        location: { latitude: 0, longitude: 0 },
        gallery: [],
        price: 0,
        tags: [],
        category: 'unknown'
      };

      const user = mockUsers[0];
      const preferences = mockUserPreferences[0];

      const features = engine['extractFeatures'](
        user,
        incompleteEvent,
        mockInteractions,
        mockSocialConnections,
        preferences
      );

      expect(features).toBeDefined();
      expect(features.event_category).toBeDefined();
      expect(features.event_price).toBe(0);
    });
  });
});


