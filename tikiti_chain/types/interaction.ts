export type InteractionType = "view" | "like" | "favorite" | "purchase" | "share" | "attend";

export type UserInteraction = {
  id: string;
  user_id: string;
  event_id: string;
  interaction_type: InteractionType;
  timestamp: string;
  rating?: number;
  duration?: number;
  created_at: string;
  updated_at: string;
};

export type UserSocialConnection = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  connection_strength: number;
};

export type EventInteractionCounts = {
  likes: number;
  favorites: number;
  attendees: number;
  shares: number;
};

export type EventAttendee = {
  id: string;
  username: string;
  firstname?: string;
  lastname?: string;
};
