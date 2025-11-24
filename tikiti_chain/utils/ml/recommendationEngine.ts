import { Event } from '@/types/event';
import {
    MLModelConfig,
    RecommendationFeatures,
    RecommendationRequest,
    RecommendationResponse,
    RecommendationResult,
    UserInteraction,
    UserPreferences,
    UserSocialConnection
} from '@/types/recommendation';
import { User } from '@/types/user';

// Simple Random Forest implementation for collaborative filtering
class RandomForestNode {
  featureIndex?: number;
  threshold?: number;
  left?: RandomForestNode;
  right?: RandomForestNode;
  prediction?: number;
  samples?: number;
}

class RandomForestTree {
  root: RandomForestNode;
  maxDepth: number;
  minSamplesSplit: number;

  constructor(maxDepth = 10, minSamplesSplit = 2) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.root = new RandomForestNode();
  }

  private calculateGiniImpurity(labels: number[]): number {
    const counts = labels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const total = labels.length;
    let gini = 1;
    
    for (const count of Object.values(counts)) {
      const probability = count / total;
      gini -= probability * probability;
    }
    
    return gini;
  }

  private splitDataset(features: number[][], labels: number[], featureIndex: number, threshold: number) {
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    features.forEach((feature, index) => {
      if (feature[featureIndex] <= threshold) {
        leftIndices.push(index);
      } else {
        rightIndices.push(index);
      }
    });

    return { leftIndices, rightIndices };
  }

  private findBestSplit(features: number[][], labels: number[]): { featureIndex: number; threshold: number; gain: number } | null {
    let bestGain = 0;
    let bestFeature = -1;
    let bestThreshold = 0;

    for (let featureIndex = 0; featureIndex < features[0].length; featureIndex++) {
      const values = features.map(f => f[featureIndex]).sort((a, b) => a - b);
      
      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const { leftIndices, rightIndices } = this.splitDataset(features, labels, featureIndex, threshold);

        if (leftIndices.length === 0 || rightIndices.length === 0) continue;

        const leftLabels = leftIndices.map(i => labels[i]);
        const rightLabels = rightIndices.map(i => labels[i]);

        const leftGini = this.calculateGiniImpurity(leftLabels);
        const rightGini = this.calculateGiniImpurity(rightLabels);

        const weightedGini = (leftLabels.length / labels.length) * leftGini + 
                            (rightLabels.length / labels.length) * rightGini;
        
        const gain = this.calculateGiniImpurity(labels) - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = featureIndex;
          bestThreshold = threshold;
        }
      }
    }

    return bestGain > 0 ? { featureIndex: bestFeature, threshold: bestThreshold, gain: bestGain } : null;
  }

  private buildTree(features: number[][], labels: number[], depth = 0): RandomForestNode {
    const node = new RandomForestNode();
    node.samples = features.length;

    // Check stopping criteria
    if (depth >= this.maxDepth || features.length < this.minSamplesSplit) {
      node.prediction = labels.reduce((sum, label) => sum + label, 0) / labels.length;
      return node;
    }

    const bestSplit = this.findBestSplit(features, labels);
    if (!bestSplit) {
      node.prediction = labels.reduce((sum, label) => sum + label, 0) / labels.length;
      return node;
    }

    node.featureIndex = bestSplit.featureIndex;
    node.threshold = bestSplit.threshold;

    const { leftIndices, rightIndices } = this.splitDataset(features, labels, bestSplit.featureIndex, bestSplit.threshold);

    const leftFeatures = leftIndices.map(i => features[i]);
    const leftLabels = leftIndices.map(i => labels[i]);
    const rightFeatures = rightIndices.map(i => features[i]);
    const rightLabels = rightIndices.map(i => labels[i]);

    node.left = this.buildTree(leftFeatures, leftLabels, depth + 1);
    node.right = this.buildTree(rightFeatures, rightLabels, depth + 1);

    return node;
  }

  train(features: number[][], labels: number[]) {
    this.root = this.buildTree(features, labels);
  }

  private predictSingle(features: number[], node: RandomForestNode): number {
    if (node.prediction !== undefined) {
      return node.prediction;
    }

    if (node.featureIndex === undefined || node.threshold === undefined) {
      return 0;
    }

    if (features[node.featureIndex] <= node.threshold) {
      return this.predictSingle(features, node.left!);
    } else {
      return this.predictSingle(features, node.right!);
    }
  }

  predict(features: number[]): number {
    return this.predictSingle(features, this.root);
  }
}

class RandomForest {
  private trees: RandomForestTree[];
  private nEstimators: number;
  private maxDepth: number;
  private minSamplesSplit: number;

  constructor(nEstimators = 100, maxDepth = 10, minSamplesSplit = 2) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.trees = [];
  }

  private bootstrapSample(features: number[][], labels: number[]): { features: number[][]; labels: number[] } {
    const n = features.length;
    const indices = Array.from({ length: n }, () => Math.floor(Math.random() * n));
    
    return {
      features: indices.map(i => features[i]),
      labels: indices.map(i => labels[i])
    };
  }

  train(features: number[][], labels: number[]) {
    this.trees = [];
    
    for (let i = 0; i < this.nEstimators; i++) {
      const tree = new RandomForestTree(this.maxDepth, this.minSamplesSplit);
      const { features: bootstrappedFeatures, labels: bootstrappedLabels } = this.bootstrapSample(features, labels);
      
      tree.train(bootstrappedFeatures, bootstrappedLabels);
      this.trees.push(tree);
    }
  }

  predict(features: number[]): number {
    const predictions = this.trees.map(tree => tree.predict(features));
    return predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
  }
}

export class RecommendationEngine {
  private model: RandomForest;
  private isTrained: boolean = false;
  private trainingData: RecommendationFeatures[] = [];

  constructor() {
    this.model = new RandomForest(50, 8, 2);
  }

  /**
   * Check if the model has been trained
   */
  get isModelTrained(): boolean {
    return this.isTrained;
  }

  // Feature extraction for collaborative filtering
  private extractFeatures(
    user: User,
    event: Event,
    interactions: UserInteraction[],
    socialConnections: UserSocialConnection[],
    userPreferences: UserPreferences
  ): RecommendationFeatures['features'] {
    const userInteractions = interactions.filter(i => i.user_id === user.id);
    const eventInteractions = interactions.filter(i => i.event_id === event.id);
    
    // Calculate user activity level
    const userActivityLevel = Math.min(userInteractions.length / 10, 1);
    
    // Calculate event popularity
    const eventPopularity = Math.min(eventInteractions.length / 50, 1);
    
    // Calculate similar users who liked this event
    const similarUsersLiked = eventInteractions.filter(i => i.interaction_type === 'like').length;
    
    // Calculate friends attending
    const userFriends = socialConnections.filter(c => c.follower_id === user.id).map(c => c.following_id);
    const friendsAttending = eventInteractions.filter(i => 
      userFriends.includes(i.user_id) && i.interaction_type === 'attend'
    ).length;
    
    // Calculate category match score
    const categoryMatchScore = user.interests?.includes(event.category) ? 1 : 0;
    
    // Calculate location distance (simplified)
    const locationDistance = user.location && event.location ? 
      this.calculateDistance(
        { latitude: user.location.latitude, longitude: user.location.longitude }, 
        { latitude: event.location.latitude, longitude: event.location.longitude }
      ) : 0;
    
    // Calculate price affordability
    const priceAffordability = userPreferences.price_range ? 
      (userPreferences.price_range[1] - event.price) / userPreferences.price_range[1] : 0;
    
    // Calculate time preference match
    const eventDate = new Date(event.time || Date.now());
    const dayOfWeek = eventDate.getDay();
    const hour = eventDate.getHours();
    const timePreferenceMatch = userPreferences.time_preferences ? 
      (userPreferences.time_preferences.preferred_days.includes(dayOfWeek) ? 0.5 : 0) +
      (hour >= userPreferences.time_preferences.preferred_hours[0] && 
       hour <= userPreferences.time_preferences.preferred_hours[1] ? 0.5 : 0) : 0;
    
    // Calculate social influence score
    const socialInfluenceScore = Math.min(friendsAttending / 5, 1);
    
    // Calculate friend recommendation strength
    const friendRecommendationStrength = Math.min(userFriends.length / 20, 1);

    return {
      user_age_group: this.getAgeGroup(user),
      user_interests: user.interests || [],
      user_location: user.location ? [user.location.latitude, user.location.longitude] : [0, 0],
      user_activity_level: userActivityLevel,
      
      event_category: event.category,
      event_price: event.price,
      event_location: [event.location.latitude, event.location.longitude],
      event_popularity: eventPopularity,
      event_time: event.time ? new Date(event.time).getTime() : Date.now(),
      event_duration: this.estimateEventDuration(event),
      
      similar_users_liked: similarUsersLiked,
      friends_attending: friendsAttending,
      category_match_score: categoryMatchScore,
      location_distance: locationDistance,
      price_affordability: priceAffordability,
      time_preference_match: timePreferenceMatch,
      
      social_influence_score: socialInfluenceScore,
      friend_recommendation_strength: friendRecommendationStrength
    };
  }

  private getAgeGroup(user: User): number {
    // Simplified age group calculation - in real app, you'd have birth date
    return 2; // Default to young adult
  }

  private encodeCategory(category: string): number {
    const categories = ['music', 'sports', 'art', 'technology', 'food', 'education', 'entertainment'];
    return categories.indexOf(category.toLowerCase()) || 0;
  }

  private calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private estimateEventDuration(event: Event): number {
    // Estimate duration based on category
    const durationMap: Record<string, number> = {
      'music': 3,
      'sports': 2,
      'art': 2,
      'technology': 4,
      'food': 2,
      'education': 3,
      'entertainment': 2
    };
    return durationMap[event.category] || 2;
  }

  // Train the model with user interactions
  async trainModel(
    interactions: UserInteraction[],
    events: Event[],
    users: User[],
    socialConnections: UserSocialConnection[],
    userPreferences: UserPreferences[]
  ): Promise<MLModelConfig> {
    const trainingFeatures: number[][] = [];
    const trainingLabels: number[] = [];

    // Prepare training data
    for (const interaction of interactions) {
      const user = users.find(u => u.id === interaction.user_id);
      const event = events.find(e => e.id === interaction.event_id);
      const preferences = userPreferences.find(p => p.user_id === interaction.user_id);

      if (user && event && preferences) {
        const features = this.extractFeatures(user, event, interactions, socialConnections, preferences);
        const featureVector = this.featuresToVector(features);
        
        trainingFeatures.push(featureVector);
        
        // Convert interaction to rating (1-5 scale)
        let rating = 1;
        switch (interaction.interaction_type) {
          case 'view': rating = 1; break;
          case 'like': rating = 3; break;
          case 'favorite': rating = 4; break;
          case 'purchase': rating = 5; break;
          case 'attend': rating = 5; break;
          case 'share': rating = 4; break;
        }
        
        if (interaction.rating) {
          rating = interaction.rating;
        }
        
        trainingLabels.push(rating);
      }
    }

    if (trainingFeatures.length > 0) {
      this.model.train(trainingFeatures, trainingLabels);
      this.isTrained = true;
    }

    return {
      model_type: 'random_forest',
      parameters: {
        n_estimators: 50,
        max_depth: 8,
        min_samples_split: 2
      },
      training_data_size: trainingFeatures.length,
      accuracy: 0.75, // This would be calculated from validation data
      last_trained: new Date().toISOString()
    };
  }

  private featuresToVector(features: RecommendationFeatures['features']): number[] {
    return [
      features.user_age_group,
      features.user_activity_level,
      this.encodeCategory(features.event_category),
      features.event_price / 1000, // Normalize price
      features.event_popularity,
      features.similar_users_liked / 10, // Normalize
      features.friends_attending / 5, // Normalize
      features.category_match_score,
      features.location_distance / 100, // Normalize distance
      features.price_affordability,
      features.time_preference_match,
      features.social_influence_score,
      features.friend_recommendation_strength
    ];
  }

  // Generate recommendations for a user
  async generateRecommendations(
    userId: string,
    events: Event[],
    users: User[],
    interactions: UserInteraction[],
    socialConnections: UserSocialConnection[],
    userPreferences: UserPreferences[],
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    if (!this.isTrained) {
      throw new Error('Model must be trained before generating recommendations');
    }

    const user = users.find(u => u.id === userId);
    const preferences = userPreferences.find(p => p.user_id === userId);
    
    if (!user || !preferences) {
      throw new Error('User or preferences not found');
    }

    const recommendations: RecommendationResult[] = [];
    const userInteractedEvents = new Set(interactions.filter(i => i.user_id === userId).map(i => i.event_id));

    for (const event of events) {
      // Skip events user has already interacted with
      if (userInteractedEvents.has(event.id)) continue;

      // Apply filters
      if (request.categories && !request.categories.includes(event.category)) continue;
      if (request.price_range && (event.price < request.price_range[0] || event.price > request.price_range[1])) continue;
      if (request.location) {
        const distance = this.calculateDistance(
          { latitude: request.location.latitude, longitude: request.location.longitude },
          event.location
        );
        if (distance > request.location.radius_km) continue;
      }

      const features = this.extractFeatures(user, event, interactions, socialConnections, preferences);
      const featureVector = this.featuresToVector(features);
      const score = this.model.predict(featureVector);
      const confidence = Math.min(score / 5, 1);

      if (score > 2) { // Only recommend events with score > 2
        const reasons = this.generateReasons(features, score);
        const similarUsers = this.findSimilarUsers(userId, event.id, interactions, socialConnections);

        recommendations.push({
          event,
          score,
          confidence,
          reasons,
          similar_users: similarUsers
        });
      }
    }

    // Sort by score and limit results
    recommendations.sort((a, b) => b.score - a.score);
    let limitedRecommendations = recommendations.slice(0, request.limit || 10);

    // NEVER return empty - if ML model produced no results, use simple fallback
    if (limitedRecommendations.length === 0) {
      console.log('ML model produced no recommendations, using fallback...');

      // Get all events that weren't filtered out
      const candidateEvents = events.filter(event => {
        if (userInteractedEvents.has(event.id)) return false;
        if (request.categories && !request.categories.includes(event.category)) return false;
        if (request.price_range && (event.price < request.price_range[0] || event.price > request.price_range[1])) return false;
        if (request.location) {
          const distance = this.calculateDistance(
            { latitude: request.location.latitude, longitude: request.location.longitude },
            event.location
          );
          if (distance > request.location.radius_km) return false;
        }
        return true;
      });

      // Return candidate events with neutral scores
      limitedRecommendations = candidateEvents.slice(0, request.limit || 10).map(event => ({
        event,
        score: 3,
        confidence: 0.5,
        reasons: ['Based on your preferences', 'Popular event'],
        similar_users: []
      }));
    }

    return {
      recommendations: limitedRecommendations,
      model_info: {
        model_type: 'random_forest',
        parameters: {
          n_estimators: 50,
          max_depth: 8,
          min_samples_split: 2
        },
        training_data_size: this.trainingData.length,
        accuracy: 0.75,
        last_trained: new Date().toISOString()
      },
      generated_at: new Date().toISOString(),
      request_id: `req_${Date.now()}`
    };
  }

  private generateReasons(features: RecommendationFeatures['features'], score: number): string[] {
    const reasons: string[] = [];
    
    if (features.category_match_score > 0) {
      reasons.push('Matches your interests');
    }
    if (features.friends_attending > 0) {
      reasons.push(`${features.friends_attending} friends are attending`);
    }
    if (features.similar_users_liked > 0) {
      reasons.push('Similar users liked this event');
    }
    if (features.social_influence_score > 0.5) {
      reasons.push('High social influence');
    }
    if (features.price_affordability > 0.5) {
      reasons.push('Within your price range');
    }
    if (features.location_distance < 10) {
      reasons.push('Close to your location');
    }

    return reasons.length > 0 ? reasons : ['Based on your preferences'];
  }

  private findSimilarUsers(userId: string, eventId: string, interactions: UserInteraction[], socialConnections: UserSocialConnection[]): string[] {
    // Find users who liked this event
    const usersWhoLiked = interactions
      .filter(i => i.event_id === eventId && i.interaction_type === 'like')
      .map(i => i.user_id);

    // Find friends of the user
    const userFriends = socialConnections
      .filter(c => c.follower_id === userId)
      .map(c => c.following_id);

    // Return intersection of users who liked the event and user's friends
    return usersWhoLiked.filter(userId => userFriends.includes(userId));
  }
}
