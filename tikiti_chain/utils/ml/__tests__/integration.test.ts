import { Event } from '@/types/event';
import { UserInteraction, UserPreferences } from '@/types/recommendation';
import { User } from '@/types/user';
import { RecommendationEngine } from '../recommendationEngine';
import { SupabaseRecommendationService } from '../supabaseRecommendationService';

// Mock Supabase client
jest.mock('@/utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }))
    }))
  }
}));

describe('Recommendation System Integration', () => {
  let recommendationService: SupabaseRecommendationService;
  let recommendationEngine: RecommendationEngine;

  beforeEach(() => {
    recommendationService = new SupabaseRecommendationService();
    recommendationEngine = new RecommendationEngine();
  });

  describe('Service Integration', () => {
    it('should initialize services without errors', () => {
      expect(recommendationService).toBeDefined();
      expect(recommendationEngine).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      const mockInteractions: UserInteraction[] = [];
      const mockEvents: Event[] = [];
      const mockUsers: User[] = [];
      const mockSocialConnections: any[] = [];
      const mockUserPreferences: UserPreferences[] = [];

      const modelConfig = await recommendationEngine.trainModel(
        mockInteractions,
        mockEvents,
        mockUsers,
        mockSocialConnections,
        mockUserPreferences
      );

      expect(modelConfig).toBeDefined();
      expect(modelConfig.training_data_size).toBe(0);
    });
  });

  describe('Feature Extraction', () => {
    it('should extract features for user-event pairs', () => {
      const mockUser: User = {
        id: 'user1',
        email: 'user@example.com',
        username: 'user1',
        interests: ['music'],
        location: { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' }
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Music Concert',
        description: 'Amazing concert',
        location: { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' },
        gallery: [],
        price: 50,
        tags: ['music'],
        category: 'music',
        time: new Date().toISOString()
      };

      const mockPreferences: UserPreferences = {
        id: 'pref1',
        user_id: 'user1',
        category_preferences: { music: 5 },
        price_range: [0, 100],
        location_preferences: {
          latitude: 40.7128,
          longitude: -74.0060,
          radius_km: 50
        },
        time_preferences: {
          preferred_days: [5, 6],
          preferred_hours: [19, 23]
        },
        updated_at: new Date().toISOString()
      };

      const features = recommendationEngine['extractFeatures'](
        mockUser,
        mockEvent,
        [],
        [],
        mockPreferences
      );

      expect(features).toBeDefined();
      expect(features.user_activity_level).toBeGreaterThanOrEqual(0);
      expect(features.event_popularity).toBeGreaterThanOrEqual(0);
      expect(features.category_match_score).toBe(1); // Should match music category
    });
  });

  describe('Model Training', () => {
    it('should train model with sample data', async () => {
      const mockInteractions: UserInteraction[] = [
        {
          id: 'int1',
          user_id: 'user1',
          event_id: 'event1',
          interaction_type: 'like',
          timestamp: new Date().toISOString(),
          rating: 4
        }
      ];

      const mockEvents: Event[] = [
        {
          id: 'event1',
          title: 'Test Event',
          description: 'Test',
          location: { latitude: 40.7128, longitude: -74.0060, city: 'NYC', country: 'USA' },
          gallery: [],
          price: 50,
          tags: ['music'],
          category: 'music',
          time: new Date().toISOString()
        }
      ];

      const mockUsers: User[] = [
        {
          id: 'user1',
          email: 'user@example.com',
          username: 'user1',
          interests: ['music'],
          location: { latitude: 40.7128, longitude: -74.0060, city: 'NYC', country: 'USA' }
        }
      ];

      const mockUserPreferences: UserPreferences[] = [
        {
          id: 'pref1',
          user_id: 'user1',
          category_preferences: { music: 5 },
          price_range: [0, 100],
          location_preferences: {
            latitude: 40.7128,
            longitude: -74.0060,
            radius_km: 50
          },
          time_preferences: {
            preferred_days: [5, 6],
            preferred_hours: [19, 23]
          },
          updated_at: new Date().toISOString()
        }
      ];

      const modelConfig = await recommendationEngine.trainModel(
        mockInteractions,
        mockEvents,
        mockUsers,
        [],
        mockUserPreferences
      );

      expect(modelConfig).toBeDefined();
      expect(modelConfig.model_type).toBe('random_forest');
      expect(modelConfig.training_data_size).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      const mockUser: User = {
        id: 'user1',
        email: 'user@example.com',
        username: 'user1'
        // Missing interests and location
      };

      const mockEvent: Event = {
        id: 'event1',
        title: 'Test Event',
        description: 'Test',
        location: { latitude: 0, longitude: 0, city: 'Unknown', country: 'Unknown' },
        gallery: [],
        price: 0,
        tags: [],
        category: 'unknown'
      };

      const mockPreferences: UserPreferences = {
        id: 'pref1',
        user_id: 'user1',
        category_preferences: {},
        price_range: [0, 1000],
        location_preferences: {
          latitude: 0,
          longitude: 0,
          radius_km: 100
        },
        time_preferences: {
          preferred_days: [0, 1, 2, 3, 4, 5, 6],
          preferred_hours: [0, 23]
        },
        updated_at: new Date().toISOString()
      };

      expect(() => {
        recommendationEngine['extractFeatures'](
          mockUser,
          mockEvent,
          [],
          [],
          mockPreferences
        );
      }).not.toThrow();
    });
  });
});


