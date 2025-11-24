/**
 * Service functions for ticket listing and marketplace operations
 */

import { supabase } from './supabase';
import type {
  TicketListing,
  MarketplaceListing,
  UserTicketListing,
  CreateListingParams,
  UpdateListingParams,
  TicketResaleStats,
} from '@/types/ticketListing';

/**
 * Create a new ticket listing
 */
export const createTicketListing = async (
  params: CreateListingParams
): Promise<TicketListing> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('ticket_listings')
    .insert({
      token_id: params.token_id,
      event_id: params.event_id,
      seller_user_id: user.id,
      seller_wallet_address: params.seller_wallet_address,
      listing_price: params.listing_price,
      original_price: params.original_price,
      expires_at: params.expires_at,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  return data;
};

/**
 * Get all active marketplace listings
 */
export const getMarketplaceListings = async (
  filters?: {
    eventId?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
  }
): Promise<MarketplaceListing[]> => {
  let query = supabase.from('marketplace_listings').select('*');

  // Apply filters
  if (filters?.eventId) {
    query = query.eq('event_id', filters.eventId);
  }

  if (filters?.category) {
    query = query.eq('event_category', filters.category);
  }

  if (filters?.minPrice) {
    query = query.gte('listing_price', filters.minPrice);
  }

  if (filters?.maxPrice) {
    query = query.lte('listing_price', filters.maxPrice);
  }

  // Apply sorting
  switch (filters?.sortBy) {
    case 'price_asc':
      query = query.order('listing_price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('listing_price', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch marketplace listings: ${error.message}`);
  }

  return data || [];
};

/**
 * Get a specific listing by ID
 */
export const getListingById = async (listingId: string): Promise<MarketplaceListing> => {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch listing: ${error.message}`);
  }

  return data;
};

/**
 * Get active listings for a specific event
 */
export const getEventListings = async (eventId: string): Promise<MarketplaceListing[]> => {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('event_id', eventId)
    .order('listing_price', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch event listings: ${error.message}`);
  }

  return data || [];
};

/**
 * Get user's own ticket listings (all statuses)
 */
export const getUserTicketListings = async (): Promise<UserTicketListing[]> => {
  const { data, error } = await supabase
    .from('user_ticket_listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user listings: ${error.message}`);
  }

  return data || [];
};

/**
 * Get user's active listings only
 */
export const getUserActiveListings = async (): Promise<UserTicketListing[]> => {
  const { data, error } = await supabase
    .from('user_ticket_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch active listings: ${error.message}`);
  }

  return data || [];
};

/**
 * Update a listing (price, expiration, etc.)
 */
export const updateTicketListing = async (
  listingId: string,
  params: UpdateListingParams
): Promise<TicketListing> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .update(params)
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return data;
};

/**
 * Cancel a listing
 */
export const cancelTicketListing = async (listingId: string): Promise<void> => {
  const { error } = await supabase.rpc('cancel_ticket_listing', {
    listing_id: listingId,
  });

  if (error) {
    throw new Error(`Failed to cancel listing: ${error.message}`);
  }
};

/**
 * Mark listing as sold (called after blockchain transfer)
 */
export const markListingSold = async (
  listingId: string,
  buyerId: string,
  buyerAddress: string,
  salePrice: number,
  txHash: string
): Promise<void> => {
  const { error } = await supabase.rpc('mark_listing_sold', {
    listing_id: listingId,
    buyer_id: buyerId,
    buyer_address: buyerAddress,
    sale_price: salePrice,
    tx_hash: txHash,
  });

  if (error) {
    throw new Error(`Failed to mark listing as sold: ${error.message}`);
  }
};

/**
 * Delete a listing (only if not sold)
 */
export const deleteTicketListing = async (listingId: string): Promise<void> => {
  const { error } = await supabase
    .from('ticket_listings')
    .delete()
    .eq('id', listingId);

  if (error) {
    throw new Error(`Failed to delete listing: ${error.message}`);
  }
};

/**
 * Get resale statistics for an event
 */
export const getEventResaleStats = async (
  eventId: string
): Promise<TicketResaleStats | null> => {
  const { data, error } = await supabase
    .from('ticket_resale_stats')
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to fetch resale stats: ${error.message}`);
  }

  return data;
};

/**
 * Check if a ticket is already listed
 */
export const isTicketListed = async (tokenId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .select('id')
    .eq('token_id', tokenId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check ticket listing status: ${error.message}`);
  }

  return !!data;
};

/**
 * Get listing by token ID
 */
export const getListingByTokenId = async (
  tokenId: string
): Promise<TicketListing | null> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .select('*')
    .eq('token_id', tokenId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch listing by token ID: ${error.message}`);
  }

  return data;
};

/**
 * Expire old listings (should be called periodically)
 */
export const expireOldListings = async (): Promise<void> => {
  const { error } = await supabase.rpc('expire_old_listings');

  if (error) {
    throw new Error(`Failed to expire old listings: ${error.message}`);
  }
};
