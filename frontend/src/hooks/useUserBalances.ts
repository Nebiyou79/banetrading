// hooks/useUserBalances.ts
// ── USER BALANCES HOOK ──
//
// BALANCE FIX:
// Previously queried /convert/balances separately, creating a second stale
// cache that could diverge from /funds/balance after conversions or approvals.
// Now delegates to useBalance (which queries /funds/balance) for a single
// source of truth. The /convert/balances endpoint is still available but
// the frontend no longer maintains a second cache for it.

import { useCallback }       from 'react';
import { useQueryClient }    from '@tanstack/react-query';
import { useBalance, BALANCE_QUERY_KEY } from './useBalance';
import type { Currency }     from '@/types/convert';

export const BALANCES_KEY = BALANCE_QUERY_KEY; // re-export so callers stay consistent

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

  // isFetching is true while a background refetch is running
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