// hooks/useUserBalances.ts
// ── USER BALANCES HOOK ──
// Delegates to useBalance (single source of truth).
// Re-exports BALANCE_QUERY_KEY so trade/index.tsx can invalidate it directly.

import { useCallback }    from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBalance, BALANCE_QUERY_KEY } from './useBalance';
import type { Currency } from '@/types/convert';

export { BALANCE_QUERY_KEY };
export const BALANCES_KEY = BALANCE_QUERY_KEY;

export interface UseUserBalancesReturn {
  balances:   Record<Currency, number>;
  isLoading:  boolean;
  isFetching: boolean;
  error:      string | null;
  refetch:    () => void;
}

export function useUserBalances(): UseUserBalancesReturn {
  const { balances, isLoading, error, refetch: refetchBalance } = useBalance();
  const queryClient = useQueryClient();

  const isFetching = queryClient.isFetching({ queryKey: BALANCE_QUERY_KEY }) > 0;

  const refetch = useCallback(() => {
    void refetchBalance();
  }, [refetchBalance]);

  return {
    balances:  balances as Record<Currency, number>,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}