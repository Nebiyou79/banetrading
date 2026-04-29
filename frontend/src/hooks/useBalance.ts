// hooks/useBalance.ts
// ── Balance polling hook ──

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { depositService } from '@/services/depositService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type { BalanceResponse } from '@/types/funds';

export const BALANCE_QUERY_KEY = ['balance'] as const;

export interface UseBalanceReturn {
  balance: number;
  isFrozen: boolean;
  data: BalanceResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBalance(): UseBalanceReturn {
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery({
    queryKey: BALANCE_QUERY_KEY,
    queryFn: async () => depositService.getBalance(),
    enabled: hasToken,
    refetchInterval: 15 * 1000,
    staleTime: 8 * 1000,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const data = (query.data ?? null) as BalanceResponse | null;
  return {
    balance: data?.balance ?? 0,
    isFrozen: data?.isFrozen ?? false,
    data,
    isLoading: hasToken && query.isLoading,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
  };
}