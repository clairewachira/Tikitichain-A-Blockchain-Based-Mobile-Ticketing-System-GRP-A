import { supabase } from "@/utils/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  InteractionType,
  EventInteractionCounts,
  EventAttendee,
} from "@/types/interaction";
import { Toast } from "toastify-react-native";

// Toggle interaction (like, favorite, attend)
export const useToggleInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      interactionType,
    }: {
      eventId: string;
      interactionType: InteractionType;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if interaction already exists
      const { data: existing, error: checkError } = await supabase
        .from("user_interactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .eq("interaction_type", interactionType)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // If exists, delete it (toggle off)
      if (existing) {
        const { error: deleteError } = await supabase
          .from("user_interactions")
          .delete()
          .eq("id", existing.id);

        if (deleteError) throw deleteError;
        return { action: "removed", interactionType };
      }

      // Otherwise, create it (toggle on)
      const { error: insertError } = await supabase
        .from("user_interactions")
        .insert({
          user_id: user.id,
          event_id: eventId,
          interaction_type: interactionType,
        });

      if (insertError) throw insertError;
      return { action: "added", interactionType };
    },
    onSuccess: (data, variables) => {
      // Invalidate specific event queries
      queryClient.invalidateQueries({
        queryKey: ["event-interactions", variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-interactions", variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ["event-attendees", variables.eventId],
      });

      // Invalidate all user-interactions queries to update EventCards on other pages
      queryClient.invalidateQueries({
        queryKey: ["user-interactions"],
      });

      const messages = {
        like: data.action === "added" ? "Liked event" : "Unliked event",
        favorite:
          data.action === "added"
            ? "Added to favorites"
            : "Removed from favorites",
        attend:
          data.action === "added"
            ? "Marked as attending"
            : "Removed from attending",
      };

      Toast.show({
        type: "success",
        text1:
          messages[data.interactionType as keyof typeof messages] ||
          "Action completed",
      });
    },
    onError: (error) => {
      console.error("Error toggling interaction:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update",
        text2: "Please try again",
      });
    },
  });
};

// Track a view interaction (automatic, not toggled)
export const useTrackView = () => {
  return useMutation({
    mutationFn: async ({
      eventId,
      duration,
    }: {
      eventId: string;
      duration?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("user_interactions").insert({
        user_id: user.id,
        event_id: eventId,
        interaction_type: "view",
        duration,
      });

      if (error) throw error;
    },
  });
};

// Track a share interaction
export const useTrackShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("user_interactions").insert({
        user_id: user.id,
        event_id: eventId,
        interaction_type: "share",
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event-interactions", variables.eventId],
      });
      Toast.show({
        type: "success",
        text1: "Shared successfully",
      });
    },
  });
};

// Get user's interactions for a specific event
export const useUserInteractions = (eventId: string) => {
  return useQuery({
    queryKey: ["user-interactions", eventId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_interactions")
        .select("interaction_type")
        .eq("user_id", user.id)
        .eq("event_id", eventId);

      if (error) throw error;
      return data.map((d) => d.interaction_type);
    },
    enabled: !!eventId,
  });
};

// Get interaction counts for an event
export const useEventInteractions = (eventId: string) => {
  return useQuery({
    queryKey: ["event-interactions", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_interactions")
        .select("interaction_type")
        .eq("event_id", eventId)
        .in("interaction_type", ["like", "favorite", "attend", "share"]);

      if (error) throw error;

      const counts: EventInteractionCounts = {
        likes: 0,
        favorites: 0,
        attendees: 0,
        shares: 0,
      };

      data.forEach((interaction) => {
        switch (interaction.interaction_type) {
          case "like":
            counts.likes++;
            break;
          case "favorite":
            counts.favorites++;
            break;
          case "attend":
            counts.attendees++;
            break;
          case "share":
            counts.shares++;
            break;
        }
      });

      return counts;
    },
    enabled: !!eventId,
  });
};

// Get list of attendees for an event
export const useEventAttendees = (eventId: string) => {
  return useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq("interaction_type", "attend");

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.users.id,
        username: item.users.username,
        firstname: item.users.firstname,
        lastname: item.users.lastname,
      })) as EventAttendee[];
    },
    enabled: !!eventId,
  });
};
