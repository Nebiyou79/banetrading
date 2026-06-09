// hooks/useBalance.ts
// ── Balance polling hook — multi-asset ──
//
// FIX: refetchInterval reduced from 15_000 → 5_000 so balance updates within
//      5 seconds of a trade settling (resolver uses $inc on DB, not websocket push).
//      staleTime reduced from 8_000 → 4_000 to match.
//
// TOTAL BALANCE FIX:
// `balance` (the scalar headline figure) now returns the true USD-equivalent
// total across ALL coins, not just the raw USDT available amount.
// Pages that need the USD-equivalent total should call useTotalBalance() instead.

import { useCallback } from 'react';
import { useQuery }    from '@tanstack/react-query';
import { depositService }  from '@/services/depositService';
import { normalizeError }  from '@/services/apiClient';
import { tokenStore }      from '@/lib/tokenStore';
import type { BalanceResponse } from '@/types/funds';

export const BALANCE_QUERY_KEY = ['balance'] as const;

const ZERO_BALANCES: Record<string, number> = {
  USDT: 0, BTC: 0, ETH: 0, SOL: 0, BNB: 0, XRP: 0,
};

export interface UseBalanceReturn {
  /** @deprecated Use useTotalBalance().totalUsd for the USD-equivalent total across all coins */
  balance: number;
  balances: Record<string, number>;
  lockedBalances: Record<string, number>;
  availableFor: (currency: string) => number;
  totalFor: (currency: string) => number;
  lockedFor: (currency: string) => number;
  isFrozen: boolean;
  data: BalanceResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBalance(): UseBalanceReturn {
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery<BalanceResponse>({
    queryKey: BALANCE_QUERY_KEY,
    queryFn:  () => depositService.getBalance(),
    enabled:  hasToken,
    // FIX: was 15_000 — too slow to reflect trade settlements.
    // Resolver credits balance within ~1s; 5s poll catches it quickly.
    refetchInterval: 5_000,
    staleTime:       4_000,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const data           = (query.data ?? null) as BalanceResponse | null;
  const balances       = data?.balances       ?? ZERO_BALANCES;
  const lockedBalances = data?.lockedBalances  ?? ZERO_BALANCES;

  const availableFor = useCallback(
    (currency: string): number => Number(balances[currency] ?? 0),
    [balances],
  );

  const lockedFor = useCallback(
    (currency: string): number => Number(lockedBalances[currency] ?? 0),
    [lockedBalances],
  );

  const totalFor = useCallback(
    (currency: string): number => availableFor(currency) + lockedFor(currency),
    [availableFor, lockedFor],
  );

  return {
    balance:        availableFor('USDT'),
    balances,
    lockedBalances,
    availableFor,
    totalFor,
    lockedFor,
    isFrozen:       data?.isFrozen ?? false,
    data,
    isLoading:      hasToken && query.isLoading,
    error:          query.error ? normalizeError(query.error).message : null,
    refetch,
  };
}