/**
 * Hook for purchasing a listed ticket from the marketplace
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTransferTicket } from '@/hooks/blockchain/useTicketContract';
import { useMarkListingSold } from './useTicketListings';
import { getWalletClientForUser } from '@/utils/wallet/transactionService';
import { Alert } from 'react-native';
import type { MarketplaceListing } from '@/types/ticketListing';

/**
 * Hook to purchase a listed ticket
 * This handles:
 * 1. Blockchain ticket transfer with payment
 * 2. Updating the listing status to 'sold'
 */
export const usePurchaseListedTicket = () => {
  const queryClient = useQueryClient();
  const transferTicket = useTransferTicket();
  const markListingSold = useMarkListingSold();

  return useMutation({
    mutationFn: async ({
      listing,
      buyerUserId,
      buyerWalletAddress,
    }: {
      listing: MarketplaceListing;
      buyerUserId: string;
      buyerWalletAddress: string;
    }) => {
      try {
        console.log('Starting purchase of listed ticket:', {
          tokenId: listing.token_id,
          price: listing.listing_price,
          eventId: listing.event_id,
        });

        // Step 1: Get buyer's wallet client
        const walletClient = await getWalletClientForUser(buyerUserId);
        if (!walletClient) {
          throw new Error('Failed to get wallet client');
        }

        // Step 2: Transfer the ticket on blockchain (buyer pays seller)
        console.log('Transferring ticket on blockchain...');
        const transferResult = await transferTicket.mutateAsync({
          params: {
            tokenId: BigInt(listing.token_id),
            to: buyerWalletAddress as `0x${string}`,
            priceInEth: listing.listing_price.toString(),
          },
          walletClient,
        });

        console.log('Ticket transferred successfully:', transferResult.hash);

        // Step 3: Mark listing as sold in database
        console.log('Marking listing as sold in database...');
        await markListingSold.mutateAsync({
          listingId: listing.id,
          buyerId: buyerUserId,
          buyerAddress: buyerWalletAddress,
          salePrice: listing.listing_price,
          txHash: transferResult.hash,
        });

        console.log('Purchase completed successfully');

        return {
          success: true,
          transactionHash: transferResult.hash,
          listing,
        };
      } catch (error: any) {
        console.error('Error purchasing listed ticket:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      Alert.alert(
        'Purchase Successful!',
        `You've successfully purchased the ticket for ${data.listing.event_title}. Transaction: ${data.transactionHash.slice(0, 10)}...`
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['event-listings', data.listing.event_id] });
      queryClient.invalidateQueries({ queryKey: ['userEventTickets'] });
      queryClient.invalidateQueries({ queryKey: ['blockchain-tickets'] });
    },
    onError: (error: Error) => {
      console.error('Purchase failed:', error);
      Alert.alert(
        'Purchase Failed',
        error.message || 'Failed to purchase ticket. Please try again.'
      );
    },
  });
};
