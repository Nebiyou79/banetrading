// hooks/useRecentTransactions.ts
// ── Recent transactions query ──

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type { RecentTransaction } from '@/types/profile';

export const transactionsRecentKey = (limit: number) =>
  ['transactions', 'recent', limit] as const;

export interface UseRecentTransactionsReturn {
  transactions: RecentTransaction[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentTransactions(limit = 10): UseRecentTransactionsReturn {
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery({
    queryKey: transactionsRecentKey(limit),
    queryFn: async () => {
      const resp = await profileService.getRecentTransactions(limit);
      return resp.transactions;
    },
    enabled: hasToken,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    transactions: (query.data ?? []) as RecentTransaction[],
    isLoading: hasToken && query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
  };
}