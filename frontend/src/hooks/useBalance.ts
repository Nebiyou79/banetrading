// hooks/useBalance.ts
// ── Balance polling hook — multi-asset ──
//
// BALANCE FIX:
// 1. Exposes `balances` (all currencies, available to spend) and
//    `lockedBalances` (pending withdrawal, not spendable).
// 2. `balance` kept as backward-compat scalar (USDT available).
// 3. `availableFor(currency)` helper for components to read per-coin available balance.
// 4. `totalFor(currency)` = available + locked (display-only aggregate).
// 5. `lockedFor(currency)` for showing pending withdrawal amounts.

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
  /** Available USDT — kept for legacy callers */
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