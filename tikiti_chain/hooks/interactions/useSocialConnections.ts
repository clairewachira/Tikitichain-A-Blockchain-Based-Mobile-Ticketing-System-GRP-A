import { supabase } from "@/utils/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toast } from "toastify-react-native";

// Toggle follow/unfollow
export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if already following
      const { data: existing, error: checkError } = await supabase
        .from("user_social_connections")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // If exists, delete it (unfollow)
      if (existing) {
        const { error: deleteError } = await supabase
          .from("user_social_connections")
          .delete()
          .eq("id", existing.id);

        if (deleteError) throw deleteError;
        return { action: "unfollowed" };
      }

      // Otherwise, create it (follow)
      const { error: insertError } = await supabase
        .from("user_social_connections")
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (insertError) throw insertError;
      return { action: "followed" };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["is-following", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["followers", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({
        queryKey: ["followers-count", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });

      Toast.show({
        type: "success",
        text1:
          data.action === "followed" ? "Following user" : "Unfollowed user",
      });
    },
    onError: (error) => {
      console.error("Error toggling follow:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update",
        text2: "Please try again",
      });
    },
  });
};

// Check if current user is following a specific user
export const useIsFollowing = (userId?: string) => {
  return useQuery({
    queryKey: ["is-following", userId],
    queryFn: async () => {
      if (!userId) return false;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_social_connections")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    },
    enabled: !!userId,
  });
};

// Get followers for a user
export const useFollowers = (userId?: string) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("user_social_connections")
        .select(
          `
          follower_id,
          users!user_social_connections_follower_id_fkey (
            id,
            username,
            firstname,
            lastname
          )
        `,
        )
        .eq("following_id", userId);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.users.id,
        username: item.users.username,
        firstname: item.users.firstname,
        lastname: item.users.lastname,
      }));
    },
    enabled: !!userId,
  });
};

// Get users that current user is following
export const useFollowing = () => {
  return useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_social_connections")
        .select(
          `
          following_id,
          users!user_social_connections_following_id_fkey (
            id,
            username,
            firstname,
            lastname
          )
        `,
        )
        .eq("follower_id", user.id);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.users.id,
        username: item.users.username,
        firstname: item.users.firstname,
        lastname: item.users.lastname,
      }));
    },
  });
};

// Get followers count for a user
export const useFollowersCount = (userId?: string) => {
  return useQuery({
    queryKey: ["followers-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("user_social_connections")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
};

// Get following count for current user
export const useFollowingCount = () => {
  return useQuery({
    queryKey: ["following-count"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("user_social_connections")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      if (error) throw error;
      return count || 0;
    },
  });
};

// Get list of friends attending an event (users you follow who are attending)
export const useFriendsAttending = (eventId: string) => {
  return useQuery({
    queryKey: ["friends-attending", eventId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get users I'm following
      const { data: following, error: followingError } = await supabase
        .from("user_social_connections")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingError) throw followingError;

      const followingIds = (following || []).map((f) => f.following_id);
      if (followingIds.length === 0) return [];

      // Get which of them are attending this event
      const { data: attending, error: attendingError } = await supabase
        .from("user_interactions")
        .select(
          `
          user_id,
          users!inner (
            id,
            username,
            firstname,
            lastname
          )
        `,
        )
        .eq("event_id", eventId)
        .eq("interaction_type", "attend")
        .in("user_id", followingIds);

      if (attendingError) throw attendingError;

      return (attending || []).map((item: any) => ({
        id: item.users.id,
        username: item.users.username,
        firstname: item.users.firstname,
        lastname: item.users.lastname,
      }));
    },
    enabled: !!eventId,
  });
};
