/**
 * Types for ticket resale/marketplace functionality
 */

export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

export type PriceStatus = 'above' | 'below' | 'equal';

export type TicketListing = {
  id: string;
  token_id: string;
  event_id: string;
  seller_user_id: string;
  seller_wallet_address: string;
  listing_price: number;
  original_price: number;
  status: ListingStatus;
  buyer_user_id?: string;
  buyer_wallet_address?: string;
  sold_price?: number;
  sold_at?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
};

export type MarketplaceListing = TicketListing & {
  event_title: string;
  event_description: string;
  event_location: any;
  event_time?: string;
  event_gallery: string[];
  event_category: string;
  organizer_wallet_address?: string;
  max_resale_price?: number;
  royalty_percent?: number;
  price_difference: number;
  price_status: PriceStatus;
};

export type UserTicketListing = {
  id: string;
  token_id: string;
  event_id: string;
  seller_user_id: string;
  listing_price: number;
  original_price: number;
  status: ListingStatus;
  created_at: string;
  sold_at?: string;
  sold_price?: number;
  buyer_wallet_address?: string;
  event_title: string;
  event_time?: string;
  event_gallery: string[];
  seller_earnings?: number;
};

export type CreateListingParams = {
  token_id: string;
  event_id: string;
  seller_wallet_address: string;
  listing_price: number;
  original_price: number;
  expires_at?: string;
};

export type UpdateListingParams = {
  listing_price?: number;
  expires_at?: string;
};

export type TicketResaleStats = {
  event_id: string;
  event_title: string;
  active_listings: number;
  sold_listings: number;
  avg_listing_price?: number;
  avg_sold_price?: number;
  min_listing_price?: number;
  max_listing_price?: number;
};
