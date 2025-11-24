import { Event } from '@/types/event';
import {
    RecommendationRequest,
    RecommendationResponse,
    UserInteraction,
    UserPreferences,
    UserSocialConnection
} from '@/types/recommendation';
import { User } from '@/types/user';
import { supabase } from '@/utils/supabase';
import { RecommendationEngine } from './recommendationEngine';

export class SupabaseRecommendationService {
  private engine: RecommendationEngine;

  constructor() {
    this.engine = new RecommendationEngine();
  }

  // Track user interactions
  async trackInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<UserInteraction> {
    const { data, error } = await supabase
      .from('user_interactions')
      .insert({
        ...interaction,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track interaction: ${error.message}`);
    }

    return data;
  }

  // Get user interactions
  async getUserInteractions(userId: string, limit = 100): Promise<UserInteraction[]> {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user interactions: ${error.message}`);
    }

    return data || [];
  }

  // Get all interactions for training
  async getAllInteractions(limit = 1000): Promise<UserInteraction[]> {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get interactions: ${error.message}`);
    }

    return data || [];
  }

  // Get user social connections
  async getUserSocialConnections(userId: string): Promise<UserSocialConnection[]> {
    const { data, error } = await supabase
      .from('user_social_connections')
      .select('*')
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    if (error) {
      throw new Error(`Failed to get social connections: ${error.message}`);
    }

    return data || [];
  }

  // Get all social connections
  async getAllSocialConnections(): Promise<UserSocialConnection[]> {
    const { data, error } = await supabase
      .from('user_social_connections')
      .select('*');

    if (error) {
      throw new Error(`Failed to get social connections: ${error.message}`);
    }

    return data || [];
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }

    return data;
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // First check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    let data, error;

    if (existing) {
      // Update existing preferences
      const result = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Insert new preferences
      const result = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return data;
  }

  // Get all user preferences
  async getAllUserPreferences(): Promise<UserPreferences[]> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*');

    if (error) {
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }

    return data || [];
  }

  // Get events
  async getEvents(limit = 100): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }

    return data || [];
  }

  // Get users
  async getUsers(limit = 100): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    return data || [];
  }

  // Train the recommendation model
  async trainModel(): Promise<void> {
    try {
      const [interactions, events, users, socialConnections, userPreferences] = await Promise.all([
        this.getAllInteractions(),
        this.getEvents(),
        this.getUsers(),
        this.getAllSocialConnections(),
        this.getAllUserPreferences()
      ]);

      await this.engine.trainModel(interactions, events, users, socialConnections, userPreferences);
    } catch (error) {
      console.error('Failed to train model:', error);
      throw error;
    }
  }

  // Generate recommendations for a user
  async generateRecommendations(userId: string, request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const [events, users, interactions, socialConnections, userPreferences] = await Promise.all([
        this.getEvents(),
        this.getUsers(),
        this.getAllInteractions(),
        this.getAllSocialConnections(),
        this.getAllUserPreferences()
      ]);

      // Check if there's enough data to train the model
      if (events.length === 0) {
        console.log('No events available');
        return this.generateFallbackRecommendations(userId, events, users, userPreferences, request);
      }

      if (interactions.length === 0 || users.length === 0 || userPreferences.length === 0) {
        console.log('Insufficient user data for ML model, using fallback recommendations...');
        console.log('Stats:', { interactions: interactions.length, users: users.length, preferences: userPreferences.length, events: events.length });
        return this.generateFallbackRecommendations(userId, events, users, userPreferences, request);
      }

      // Train the model if not already trained
      if (!this.engine.isModelTrained) {
        console.log('Training recommendation model...');
        const modelConfig = await this.engine.trainModel(interactions, events, users, socialConnections, userPreferences);

        // Check if training actually produced results
        if (modelConfig.training_data_size === 0 || !this.engine.isModelTrained) {
          console.log('Training produced no valid features, using fallback recommendations...');
          return this.generateFallbackRecommendations(userId, events, users, userPreferences, request);
        }
      }

      return await this.engine.generateRecommendations(
        userId,
        events,
        users,
        interactions,
        socialConnections,
        userPreferences,
        request
      );
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      console.log('Falling back to simple recommendations...');

      // Fallback to simple recommendations on any error
      const [events, users, userPreferences] = await Promise.all([
        this.getEvents(),
        this.getUsers(),
        this.getAllUserPreferences()
      ]);

      return this.generateFallbackRecommendations(userId, events, users, userPreferences, request);
    }
  }

  // Generate fallback recommendations when ML model can't be used
  private async generateFallbackRecommendations(
    userId: string,
    events: Event[],
    users: User[],
    userPreferences: UserPreferences[],
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const user = users.find(u => u.id === userId);
    const preferences = userPreferences.find(p => p.user_id === userId);

    // If no events at all, return empty (edge case that should never happen in production)
    if (events.length === 0) {
      return {
        recommendations: [],
        model_info: {
          model_type: 'fallback_heuristic',
          parameters: {},
          training_data_size: 0,
          accuracy: 0.6,
          last_trained: new Date().toISOString()
        },
        generated_at: new Date().toISOString(),
        request_id: `req_${Date.now()}`
      };
    }

    let filteredEvents = [...events];

    // Apply request filters
    if (request.categories) {
      filteredEvents = filteredEvents.filter(e => request.categories!.includes(e.category));
    }

    if (request.price_range) {
      filteredEvents = filteredEvents.filter(
        e => e.price >= request.price_range![0] && e.price <= request.price_range![1]
      );
    }

    if (request.location && user?.location) {
      filteredEvents = filteredEvents.filter(e => {
        const distance = this.calculateDistance(
          { latitude: request.location!.latitude, longitude: request.location!.longitude },
          e.location
        );
        return distance <= request.location!.radius_km;
      });
    }

    // Score events based on simple heuristics
    const recommendations = filteredEvents.map(event => {
      let score = 3; // Base score
      const reasons: string[] = [];

      // Match user category preferences (from interests)
      if (preferences?.category_preferences) {
        const categoryPrefs = preferences.category_preferences;

        // Check if any of the user's interests match this event's tags or category
        Object.keys(categoryPrefs).forEach(interest => {
          const interestScore = categoryPrefs[interest];
          if (interestScore > 0) {
            // Check if interest matches event category or tags
            if (event.category.toLowerCase().includes(interest.toLowerCase()) ||
                event.tags?.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))) {
              score += interestScore / 2; // Add half the interest score
              reasons.push(`Matches your interest in ${interest}`);
            }
          }
        });
      }

      // Match user interests (legacy)
      if (user?.interests?.includes(event.category)) {
        score += 1;
        reasons.push('Matches your interests');
      }

      // Check price affordability
      if (preferences?.price_range && event.price <= preferences.price_range[1]) {
        score += 0.5;
        reasons.push('Within your price range');
      }

      // Check location proximity
      if (user?.location && event.location) {
        const distance = this.calculateDistance(
          { latitude: user.location.latitude, longitude: user.location.longitude },
          event.location
        );
        if (distance < 10) {
          score += 0.5;
          reasons.push('Close to your location');
        }
      }

      // Check time preferences
      if (preferences?.time_preferences && event.time) {
        const eventDate = new Date(event.time);
        const dayOfWeek = eventDate.getDay();
        const hour = eventDate.getHours();

        if (preferences.time_preferences.preferred_days.includes(dayOfWeek)) {
          score += 0.3;
        }

        if (
          hour >= preferences.time_preferences.preferred_hours[0] &&
          hour <= preferences.time_preferences.preferred_hours[1]
        ) {
          score += 0.2;
        }
      }

      // Boost upcoming events
      if (event.time) {
        const eventDate = new Date(event.time);
        const now = new Date();
        const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (daysUntilEvent > 0 && daysUntilEvent < 30) {
          score += 0.5;
          if (reasons.length === 0) {
            reasons.push('Coming up soon');
          }
        }
      }

      if (reasons.length === 0) {
        reasons.push('Popular event in your area');
      }

      return {
        event,
        score,
        confidence: 0.6, // Lower confidence for fallback recommendations
        reasons,
        similar_users: []
      };
    });

    // Sort by score and apply limit
    recommendations.sort((a, b) => b.score - a.score);
    let limitedRecommendations = recommendations.slice(0, request.limit || 10);

    // NEVER return empty recommendations - always provide fallback
    if (limitedRecommendations.length === 0) {
      console.log('Filtered recommendations are empty, using fallback logic...');

      // Check if user has preferences set
      const hasPreferences = preferences?.category_preferences &&
                            Object.keys(preferences.category_preferences).length > 0;

      if (hasPreferences) {
        // User has preferences - return events that match ANY of their interests
        console.log('User has preferences, matching events to interests...');
        const categoryPrefs = preferences!.category_preferences!;
        const userInterests = Object.keys(categoryPrefs).filter(key => categoryPrefs[key] > 0);

        const matchedEvents = events.filter(event => {
          // Check if event matches any user interest
          return userInterests.some(interest =>
            event.category.toLowerCase().includes(interest.toLowerCase()) ||
            event.tags?.some(tag => tag.toLowerCase().includes(interest.toLowerCase())) ||
            event.title.toLowerCase().includes(interest.toLowerCase())
          );
        });

        if (matchedEvents.length > 0) {
          // Use matched events
          limitedRecommendations = matchedEvents.slice(0, request.limit || 10).map(event => ({
            event,
            score: 4,
            confidence: 0.7,
            reasons: ['Matches your interests'],
            similar_users: []
          }));
        } else {
          // No exact matches, return top-rated or recent events
          console.log('No exact matches for preferences, using top events...');
          limitedRecommendations = this.getTopEvents(events, request.limit || 10);
        }
      } else {
        // No preferences set - return random/diverse events
        console.log('No preferences set, using random diverse events...');
        limitedRecommendations = this.getRandomDiverseEvents(events, request.limit || 10);
      }
    }

    return {
      recommendations: limitedRecommendations,
      model_info: {
        model_type: 'fallback_heuristic',
        parameters: {
          has_preferences: preferences?.category_preferences &&
                          Object.keys(preferences.category_preferences).length > 0
        },
        training_data_size: 0,
        accuracy: 0.6,
        last_trained: new Date().toISOString()
      },
      generated_at: new Date().toISOString(),
      request_id: `req_${Date.now()}`
    };
  }

  // Helper method to get random diverse events from different categories
  private getRandomDiverseEvents(events: Event[], limit: number) {
    // Group events by category
    const eventsByCategory: Record<string, Event[]> = {};

    events.forEach(event => {
      if (!eventsByCategory[event.category]) {
        eventsByCategory[event.category] = [];
      }
      eventsByCategory[event.category].push(event);
    });

    const categories = Object.keys(eventsByCategory);
    const selectedEvents: Event[] = [];
    let categoryIndex = 0;

    // Round-robin selection from different categories for diversity
    while (selectedEvents.length < limit && selectedEvents.length < events.length) {
      const category = categories[categoryIndex % categories.length];
      const categoryEvents = eventsByCategory[category];

      if (categoryEvents.length > 0) {
        // Pick a random event from this category
        const randomIndex = Math.floor(Math.random() * categoryEvents.length);
        const event = categoryEvents[randomIndex];

        // Remove selected event to avoid duplicates
        categoryEvents.splice(randomIndex, 1);
        selectedEvents.push(event);
      }

      categoryIndex++;

      // Safety check: if we've cycled through all categories and none have events left
      if (categoryIndex >= categories.length * 10) {
        break;
      }
    }

    return selectedEvents.map(event => ({
      event,
      score: 3 + Math.random(), // Random score between 3-4
      confidence: 0.5,
      reasons: ['Popular event', 'Diverse selection'],
      similar_users: []
    }));
  }

  // Helper method to get top events (most recent or highest engagement)
  private getTopEvents(events: Event[], limit: number) {
    // Sort by upcoming time (future events first) and creation date
    const sortedEvents = [...events].sort((a, b) => {
      // Prioritize upcoming events
      if (a.time && b.time) {
        const now = new Date();
        const aTime = new Date(a.time);
        const bTime = new Date(b.time);

        // Both in future - prefer sooner
        if (aTime > now && bTime > now) {
          return aTime.getTime() - bTime.getTime();
        }

        // One in future, one past - prefer future
        if (aTime > now) return -1;
        if (bTime > now) return 1;
      }

      // Fallback to created_at
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return 0;
    });

    return sortedEvents.slice(0, limit).map(event => ({
      event,
      score: 3.5,
      confidence: 0.6,
      reasons: ['Popular event in your area', 'Coming up soon'],
      similar_users: []
    }));
  }

  // Helper method to calculate distance between two points
  private calculateDistance(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get recommendation history for a user
  async getRecommendationHistory(userId: string, limit = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('recommendation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get recommendation history: ${error.message}`);
    }

    return data || [];
  }

  // Save recommendation results
  async saveRecommendationResults(userId: string, recommendations: RecommendationResponse): Promise<void> {
    const { error } = await supabase
      .from('recommendation_history')
      .insert({
        user_id: userId,
        request_id: recommendations.request_id,
        recommendations: recommendations.recommendations,
        model_info: recommendations.model_info,
        generated_at: recommendations.generated_at,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to save recommendation results: ${error.message}`);
    }
  }

  // Follow/unfollow a user
  async followUser(followerId: string, followingId: string): Promise<UserSocialConnection> {
    const { data, error } = await supabase
      .from('user_social_connections')
      .insert({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to follow user: ${error.message}`);
    }

    return data;
  }

  // Unfollow a user
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('user_social_connections')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new Error(`Failed to unfollow user: ${error.message}`);
    }
  }

  // Get user's followers
  async getUserFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_social_connections')
      .select(`
        follower_id,
        profiles!user_social_connections_follower_id_fkey(*)
      `)
      .eq('following_id', userId);

    if (error) {
      throw new Error(`Failed to get followers: ${error.message}`);
    }

    return (data?.map(item => item.profiles).filter(Boolean) as unknown as User[]) || [];
  }

  // Get user's following
  async getUserFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_social_connections')
      .select(`
        following_id,
        profiles!user_social_connections_following_id_fkey(*)
      `)
      .eq('follower_id', userId);

    if (error) {
      throw new Error(`Failed to get following: ${error.message}`);
    }

    return (data?.map(item => item.profiles).filter(Boolean) as unknown as User[]) || [];
  }

  // Get trending events based on interactions
  async getTrendingEvents(limit = 10): Promise<Event[]> {
    const { data, error } = await supabase
      .from('user_interactions')
      .select(`
        event_id,
        events(*),
        count:count()
      `)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get trending events: ${error.message}`);
    }

    return (data?.map(item => item.events).filter(Boolean) as unknown as Event[]) || [];
  }

  // Get similar users based on interaction patterns
  async getSimilarUsers(userId: string, limit = 10): Promise<User[]> {
    // This is a simplified implementation
    // In a real system, you'd use more sophisticated similarity algorithms
    const { data, error } = await supabase
      .from('user_interactions')
      .select(`
        user_id,
        profiles!user_interactions_user_id_fkey(*)
      `)
      .neq('user_id', userId)
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get similar users: ${error.message}`);
    }

    return (data?.map(item => item.profiles).filter(Boolean) as unknown as User[]) || [];
  }
}
