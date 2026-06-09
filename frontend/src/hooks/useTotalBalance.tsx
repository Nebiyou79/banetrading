// hooks/useTotalBalance.ts
// ── Computes USD-equivalent total across ALL held assets ──
// FIX: price endpoint updated from /market/ticker?symbol=X → /market/price/X
//      to match the actual backend route (GET /api/market/price/:symbol)

import { useCallback } from 'react';
import { useQuery }    from '@tanstack/react-query';
import { apiClient }   from '@/services/apiClient';
import { useBalance }  from './useBalance';
import type { Coin }   from '@/types/funds';

interface PriceMap { [coin: string]: number }

async function fetchPrices(): Promise<PriceMap> {
  const symbols = ['BTCUSDT', 'ETHUSDT'];
  const results: PriceMap = { USDT: 1 };

  await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        // FIX: was /market/ticker?symbol=X — correct route is /market/price/:symbol
        const { data } = await apiClient.get(`/market/price/${sym}`);
        // Handle both { price } and { data: { price } } response shapes
        const price = Number(
          data?.data?.price ?? data?.price ?? data?.last ?? 0
        );
        if (price > 0) {
          results[sym.replace('USDT', '') as Coin] = price;
        }
      } catch {
        // leave undefined — falls back to 0 in the sum
      }
    }),
  );

  return results;
}

export interface UseTotalBalanceReturn {
  totalUsd:       number;
  lockedTotalUsd: number;
  prices:         PriceMap;
  priceOf:        (coin: string) => number;
  isPriceLoading: boolean;
}

export function useTotalBalance(): UseTotalBalanceReturn {
  const { balances, lockedBalances } = useBalance();

  const priceQuery = useQuery<PriceMap>({
    queryKey:        ['prices', 'spot'],
    queryFn:         fetchPrices,
    refetchInterval: 30_000,
    staleTime:       20_000,
    retry:           2,
  });

  const prices: PriceMap = { USDT: 1, ...(priceQuery.data ?? {}) };

  const priceOf = useCallback(
    (coin: string): number => prices[coin] ?? 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(prices)],
  );

  const totalUsd = Object.entries(balances).reduce((sum, [coin, amount]) => {
    const p = prices[coin] ?? (coin === 'USDT' ? 1 : 0);
    return sum + (Number(amount) || 0) * p;
  }, 0);

  const lockedTotalUsd = Object.entries(lockedBalances).reduce((sum, [coin, amount]) => {
    const p = prices[coin] ?? (coin === 'USDT' ? 1 : 0);
    return sum + (Number(amount) || 0) * p;
  }, 0);

  return {
    totalUsd,
    lockedTotalUsd,
    prices,
    priceOf,
    isPriceLoading: priceQuery.isLoading,
  };
}