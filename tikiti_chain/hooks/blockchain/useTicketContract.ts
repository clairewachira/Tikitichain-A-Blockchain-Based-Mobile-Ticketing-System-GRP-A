import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Address, type WalletClient } from 'viem';
import {
  createEvent as createEventContract,
  mintTicket as mintTicketContract,
  redeemTicket as redeemTicketContract,
  transferTicket as transferTicketContract,
  deactivateEvent as deactivateEventContract,
  getEvent,
  getTicket,
  getUserEventTickets,
  getTokenURI,
  getTokenOwner,
  waitForTransaction,
  createLocalPublicClient,
  toWei,
  fromWei,
} from '@/utils/contracts/ticketContract';

/**
 * Hook to get event details
 */
export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const publicClient = createLocalPublicClient();
      const event = await getEvent(eventId, publicClient);
      return event;
    },
    enabled: !!eventId,
  });
};

/**
 * Hook to get ticket details
 */
export const useTicket = (tokenId: bigint) => {
  return useQuery({
    queryKey: ['ticket', tokenId.toString()],
    queryFn: async () => {
      const publicClient = createLocalPublicClient();
      const ticket = await getTicket(tokenId, publicClient);
      return ticket;
    },
    enabled: tokenId !== undefined,
  });
};

/**
 * Hook to get user's tickets for an event
 */
export const useUserEventTickets = (userAddress: Address | undefined, eventId: string) => {
  return useQuery({
    queryKey: ['userEventTickets', userAddress, eventId],
    queryFn: async () => {
      if (!userAddress) return [];
      const publicClient = createLocalPublicClient();
      const tickets = await getUserEventTickets(userAddress, eventId, publicClient);
      return tickets;
    },
    enabled: !!userAddress && !!eventId,
  });
};

/**
 * Hook to get token URI
 */
export const useTokenURI = (tokenId: bigint) => {
  return useQuery({
    queryKey: ['tokenURI', tokenId.toString()],
    queryFn: async () => {
      const publicClient = createLocalPublicClient();
      const uri = await getTokenURI(tokenId, publicClient);
      return uri;
    },
    enabled: tokenId !== undefined,
  });
};

/**
 * Hook to get token owner
 */
export const useTokenOwner = (tokenId: bigint) => {
  return useQuery({
    queryKey: ['tokenOwner', tokenId.toString()],
    queryFn: async () => {
      const publicClient = createLocalPublicClient();
      const owner = await getTokenOwner(tokenId, publicClient);
      return owner;
    },
    enabled: tokenId !== undefined,
  });
};

/**
 * Hook to create an event
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      walletClient,
    }: {
      params: {
        eventId: string;
        priceInEth: string;
        totalSupply: number;
        royaltyPercent: number; // e.g., 500 = 5%
        maxResalePriceInEth: string;
        resaleAllowed: boolean;
        eventDate: Date;
      };
      walletClient: WalletClient;
    }) => {
      const hash = await createEventContract(
        {
          eventId: params.eventId,
          price: toWei(params.priceInEth),
          totalSupply: BigInt(params.totalSupply),
          royaltyPercent: BigInt(params.royaltyPercent),
          maxResalePrice: toWei(params.maxResalePriceInEth),
          resaleAllowed: params.resaleAllowed,
          eventDate: BigInt(Math.floor(params.eventDate.getTime() / 1000)),
        },
        walletClient
      );

      const publicClient = createLocalPublicClient();
      const receipt = await waitForTransaction(hash, publicClient);

      return { hash, receipt };
    },
    onSuccess: (data, variables) => {
      // Invalidate event query to refetch
      queryClient.invalidateQueries({ queryKey: ['event', variables.params.eventId] });
    },
  });
};

/**
 * Hook to mint a ticket
 */
export const useMintTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      walletClient,
    }: {
      params: {
        eventId: string;
        tokenURI: string;
        priceInEth: string;
      };
      walletClient: WalletClient;
    }) => {
      const hash = await mintTicketContract(
        {
          eventId: params.eventId,
          tokenURI: params.tokenURI,
          price: toWei(params.priceInEth),
        },
        walletClient
      );

      const publicClient = createLocalPublicClient();
      const receipt = await waitForTransaction(hash, publicClient);

      return { hash, receipt };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['event', variables.params.eventId] });
      queryClient.invalidateQueries({ queryKey: ['userEventTickets'] });
    },
  });
};

/**
 * Hook to redeem a ticket
 */
export const useRedeemTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tokenId,
      walletClient,
    }: {
      tokenId: bigint;
      walletClient: WalletClient;
    }) => {
      const hash = await redeemTicketContract(tokenId, walletClient);

      const publicClient = createLocalPublicClient();
      const receipt = await waitForTransaction(hash, publicClient);

      return { hash, receipt };
    },
    onSuccess: (data, variables) => {
      // Invalidate ticket query
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.tokenId.toString()] });
    },
  });
};

/**
 * Hook to transfer ticket (resale)
 */
export const useTransferTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      walletClient,
    }: {
      params: {
        tokenId: bigint;
        to: Address;
        priceInEth: string;
      };
      walletClient: WalletClient;
    }) => {
      const hash = await transferTicketContract(
        {
          tokenId: params.tokenId,
          to: params.to,
          price: toWei(params.priceInEth),
        },
        walletClient
      );

      const publicClient = createLocalPublicClient();
      const receipt = await waitForTransaction(hash, publicClient);

      return { hash, receipt };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.params.tokenId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['tokenOwner', variables.params.tokenId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['userEventTickets'] });
    },
  });
};

/**
 * Hook to deactivate an event
 */
export const useDeactivateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      walletClient,
    }: {
      eventId: string;
      walletClient: WalletClient;
    }) => {
      const hash = await deactivateEventContract(eventId, walletClient);

      const publicClient = createLocalPublicClient();
      const receipt = await waitForTransaction(hash, publicClient);

      return { hash, receipt };
    },
    onSuccess: (data, variables) => {
      // Invalidate event query
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
    },
  });
};

// Export utility functions for easy access
export { toWei, fromWei };
