import { useAuthContext } from '@/hooks/auth/use-auth-context';
import {
    RecommendationRequest,
    UserInteraction,
    UserPreferences
} from '@/types/recommendation';
import { SupabaseRecommendationService } from '@/utils/ml/supabaseRecommendationService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const recommendationService = new SupabaseRecommendationService();

export const useRecommendations = (request: RecommendationRequest) => {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['recommendations', profile?.id, request],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.generateRecommendations(profile.id, request);
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTrackInteraction = () => {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interaction: Omit<UserInteraction, 'id' | 'timestamp' | 'user_id'>) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.trackInteraction({
        ...interaction,
        user_id: profile.id
      });
    },
    onSuccess: () => {
      // Invalidate recommendations cache to get fresh recommendations
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useUserInteractions = (limit = 50) => {
  const { profile } = useAuthContext();

  return useQuery({
    queryKey: ['user-interactions', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.getUserInteractions(profile.id, limit);
    },
    enabled: !!profile?.id,
  });
};

export const useUserPreferences = () => {
  const { profile } = useAuthContext();

  return useQuery({
    queryKey: ['user-preferences', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.getUserPreferences(profile.id);
    },
    enabled: !!profile?.id,
  });
};

export const useUpdateUserPreferences = () => {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.updateUserPreferences(profile.id, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useSocialConnections = () => {
  const { profile } = useAuthContext();

  return useQuery({
    queryKey: ['social-connections', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      const [followers, following] = await Promise.all([
        recommendationService.getUserFollowers(profile.id),
        recommendationService.getUserFollowing(profile.id)
      ]);
      return { followers, following };
    },
    enabled: !!profile?.id,
  });
};

export const useFollowUser = () => {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.followUser(profile.id, followingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useUnfollowUser = () => {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.unfollowUser(profile.id, followingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

export const useTrendingEvents = (limit = 10) => {
  return useQuery({
    queryKey: ['trending-events', limit],
    queryFn: () => recommendationService.getTrendingEvents(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSimilarUsers = (limit = 10) => {
  const { profile } = useAuthContext();

  return useQuery({
    queryKey: ['similar-users', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.getSimilarUsers(profile.id, limit);
    },
    enabled: !!profile?.id,
  });
};

export const useRecommendationHistory = (limit = 20) => {
  const { profile } = useAuthContext();

  return useQuery({
    queryKey: ['recommendation-history', profile?.id, limit],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');
      return await recommendationService.getRecommendationHistory(profile.id, limit);
    },
    enabled: !!profile?.id,
  });
};

export const useTrainModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recommendationService.trainModel(),
    onSuccess: () => {
      // Invalidate all recommendation queries to get fresh results
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
};

