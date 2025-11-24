import { supabase } from "@/utils/supabase";
import { useQuery } from "@tanstack/react-query";

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      console.log("Fetching events from Supabase...");
      const { data, error } = await supabase.from("events").select("*");

      if (error) {
        console.error("Error fetching events:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      console.log(`Successfully fetched ${data?.length || 0} events`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) {
        console.error(`Error fetching event ${id}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Failed to fetch event ${id}: ${error.message}`);
      }
      return data;
    },
    enabled: !!id,
  });
};
