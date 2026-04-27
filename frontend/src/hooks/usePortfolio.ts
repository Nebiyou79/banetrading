// hooks/usePortfolio.ts
// ── Portfolio query, 30s refetch ──

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type { Portfolio } from '@/types/profile';

export const PORTFOLIO_QUERY_KEY = ['portfolio'] as const;

export interface UsePortfolioReturn {
  portfolio: Portfolio | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: async () => profileService.getPortfolio(),
    enabled: hasToken,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    portfolio: (query.data ?? null) as Portfolio | null,
    isLoading: hasToken && query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
  };
}