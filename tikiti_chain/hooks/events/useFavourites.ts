import { supabase } from "@/utils/supabase";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@/types/event";

export const useFavouriteEvents = () => {
  return useQuery({
    queryKey: ["favourite-events"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all event IDs that the user has favorited
      const { data: interactions, error: interactionsError } = await supabase
        .from("user_interactions")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("interaction_type", "favorite");

      if (interactionsError) throw interactionsError;

      const eventIds = (interactions || []).map((i) => i.event_id);
      if (eventIds.length === 0) return [];

      // Get the full event details for favorited events
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds);

      if (eventsError) throw eventsError;

      return (events || []) as Event[];
    },
  });
};
