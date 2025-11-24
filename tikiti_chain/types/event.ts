import { Location } from "./location";

export type Event = {
  id: string;
  title: string;
  description: string;
  location: Location;
  gallery: string[];
  price: number;
  tags: string[];
  category: string;
  time?: string; // ISO timestamp
  duration?: number; // in minutes
  // Blockchain fields
  blockchain_enabled?: boolean;
  blockchain_event_id?: string;
  contract_address?: string;
  total_supply?: number;
  tickets_sold?: number;
  royalty_percent?: number;
  max_resale_price?: number;
  resale_allowed?: boolean;
  blockchain_active?: boolean;
  organizer_wallet_address?: string;
};
