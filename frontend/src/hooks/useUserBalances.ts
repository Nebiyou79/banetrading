// hooks/useUserBalances.ts
// ── USER BALANCES HOOK ──

import { useQuery } from '@tanstack/react-query';
import { conversionService } from '@/services/conversionService';
import type { Currency, UserBalances } from '@/types/convert';

export const BALANCES_KEY = ['balances'] as const;

export interface UseUserBalancesReturn {
  balances: Record<Currency, number>;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserBalances(): UseUserBalancesReturn {
  const query = useQuery<UserBalances>({
    queryKey: BALANCES_KEY,
    queryFn: () => conversionService.getBalances(),
    staleTime: 10_000,
  });

  return {
    balances: (query.data?.balances ?? {}) as Record<Currency, number>,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}