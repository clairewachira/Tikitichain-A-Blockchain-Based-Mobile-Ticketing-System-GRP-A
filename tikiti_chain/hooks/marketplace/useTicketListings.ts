/**
 * React Query hooks for ticket listing operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTicketListing,
  getMarketplaceListings,
  getListingById,
  getEventListings,
  getUserTicketListings,
  getUserActiveListings,
  updateTicketListing,
  cancelTicketListing,
  markListingSold,
  deleteTicketListing,
  getEventResaleStats,
  isTicketListed,
  getListingByTokenId,
} from '@/utils/ticketListingService';
import type {
  CreateListingParams,
  UpdateListingParams,
  MarketplaceListing,
  UserTicketListing,
} from '@/types/ticketListing';

/**
 * Hook to fetch all marketplace listings with optional filters
 */
export const useMarketplaceListings = (filters?: {
  eventId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
}) => {
  return useQuery({
    queryKey: ['marketplace-listings', filters],
    queryFn: () => getMarketplaceListings(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch a specific listing by ID
 */
export const useListing = (listingId: string) => {
  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId,
  });
};

/**
 * Hook to fetch listings for a specific event
 */
export const useEventListings = (eventId: string) => {
  return useQuery({
    queryKey: ['event-listings', eventId],
    queryFn: () => getEventListings(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch current user's ticket listings
 */
export const useUserTicketListings = () => {
  return useQuery({
    queryKey: ['user-ticket-listings'],
    queryFn: getUserTicketListings,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

/**
 * Hook to fetch current user's active listings only
 */
export const useUserActiveListings = () => {
  return useQuery({
    queryKey: ['user-active-listings'],
    queryFn: getUserActiveListings,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

/**
 * Hook to create a new ticket listing
 */
export const useCreateTicketListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateListingParams) => createTicketListing(params),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['event-listings', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['user-ticket-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-listings'] });
    },
  });
};

/**
 * Hook to update a ticket listing
 */
export const useUpdateTicketListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listingId,
      params,
    }: {
      listingId: string;
      params: UpdateListingParams;
    }) => updateTicketListing(listingId, params),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['listing', data.id] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['event-listings', data.event_id] });
      queryClient.invalidateQueries({ queryKey: ['user-ticket-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-listings'] });
    },
  });
};

/**
 * Hook to cancel a ticket listing
 */
export const useCancelTicketListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => cancelTicketListing(listingId),
    onSuccess: () => {
      // Invalidate all listing queries
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['event-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-ticket-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-listings'] });
    },
  });
};

/**
 * Hook to mark a listing as sold
 */
export const useMarkListingSold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listingId,
      buyerId,
      buyerAddress,
      salePrice,
      txHash,
    }: {
      listingId: string;
      buyerId: string;
      buyerAddress: string;
      salePrice: number;
      txHash: string;
    }) => markListingSold(listingId, buyerId, buyerAddress, salePrice, txHash),
    onSuccess: () => {
      // Invalidate all listing queries
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['event-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-ticket-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-listings'] });
    },
  });
};

/**
 * Hook to delete a ticket listing
 */
export const useDeleteTicketListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => deleteTicketListing(listingId),
    onSuccess: () => {
      // Invalidate all listing queries
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['event-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-ticket-listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-listings'] });
    },
  });
};

/**
 * Hook to get resale statistics for an event
 */
export const useEventResaleStats = (eventId: string) => {
  return useQuery({
    queryKey: ['event-resale-stats', eventId],
    queryFn: () => getEventResaleStats(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to check if a ticket is already listed
 */
export const useIsTicketListed = (tokenId: string) => {
  return useQuery({
    queryKey: ['is-ticket-listed', tokenId],
    queryFn: () => isTicketListed(tokenId),
    enabled: !!tokenId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Hook to get listing by token ID
 */
export const useListingByTokenId = (tokenId: string) => {
  return useQuery({
    queryKey: ['listing-by-token', tokenId],
    queryFn: () => getListingByTokenId(tokenId),
    enabled: !!tokenId,
  });
};
