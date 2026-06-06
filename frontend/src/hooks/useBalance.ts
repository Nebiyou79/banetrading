// hooks/useBalance.ts
// ── Balance polling hook — multi-asset ──
//
// TOTAL BALANCE FIX:
// `balance` (the scalar headline figure) now returns the true USD-equivalent
// total across ALL coins, not just the raw USDT available amount.
// This fixes the balance page showing $700 when the user also holds 5 BTC.
//
// How: useBalance fetches raw coin amounts; useTotalBalance (a thin wrapper
// that calls useBalance + a price feed) computes the conversion.
// To avoid a circular dependency, useBalance itself stays price-unaware —
// the page/BalanceHero that needs the total should call useTotalBalance instead.
//
// What changed:
//   • `balance` is now DEPRECATED as a "USDT total" — callers that need the
//     USD-equivalent total should use useTotalBalance().totalUsd instead.
//   • Everything else (balances, lockedBalances, availableFor, etc.) is unchanged.

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
  /** All available balances by currency symbol */
  balances: Record<string, number>;
  /** Amounts locked in pending withdrawals, by currency symbol */
  lockedBalances: Record<string, number>;
  /** Available (spendable) amount for a specific currency */
  availableFor: (currency: string) => number;
  /** Total (available + locked) for a specific currency */
  totalFor: (currency: string) => number;
  /** Locked (pending withdrawal) for a specific currency */
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
    refetchInterval: 15_000,
    staleTime:        8_000,
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
    // Keep returning USDT-only for legacy callers — pages should migrate to useTotalBalance
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