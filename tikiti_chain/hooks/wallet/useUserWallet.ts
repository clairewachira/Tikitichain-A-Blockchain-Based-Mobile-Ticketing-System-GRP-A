import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/hooks/auth/use-auth-context';
import {
  generateUserWallet,
  getUserWalletAddress,
  getUserPrivateKey,
  userHasWallet,
} from '@/utils/wallet/walletManager';
import { supabase } from '@/utils/supabase';

/**
 * Hook to check if user has a wallet
 */
export const useHasWallet = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['userWallet', 'hasWallet', userId],
    queryFn: async () => {
      if (!userId) return false;
      return await userHasWallet(userId);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to get user's wallet address
 */
export const useWalletAddress = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['userWallet', 'address', userId],
    queryFn: async () => {
      if (!userId) return null;
      return await getUserWalletAddress(userId);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to get user's wallet details
 */
export const useUserWallet = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['userWallet', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

/**
 * Hook to generate/create a wallet for user
 */
export const useGenerateWallet = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return await generateUserWallet(userId);
    },
    onSuccess: () => {
      // Invalidate wallet queries to refetch
      queryClient.invalidateQueries({ queryKey: ['userWallet'] });
    },
  });
};

/**
 * Hook to get user's private key (use with extreme caution!)
 * This should only be used when signing transactions
 */
export const useGetPrivateKey = () => {
  const { session } = useAuthContext();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return await getUserPrivateKey(userId);
    },
  });
};
