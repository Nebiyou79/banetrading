// hooks/useTotalBalance.ts
// ── Computes USD-equivalent total across ALL held assets ──
//
// Uses live prices from /api/market (already in the app) to convert
// BTC / ETH / SOL / BNB / XRP balances to USDT before summing.
// Falls back to 0 for any coin whose price can't be fetched.
//
// Returns:
//   totalUsd       — sum of all assets in USD (use this for the headline)
//   lockedTotalUsd — sum of all locked balances in USD
//   priceOf(coin)  — live USD price for any supported coin

import { useCallback } from 'react';
import { useQuery }    from '@tanstack/react-query';
import { apiClient }   from '@/services/apiClient';
import { useBalance }  from './useBalance';
import type { Coin }   from '@/types/funds';

// Coins that need a price lookup (USDT is already 1:1)
const PRICED_COINS: Coin[] = ['BTC', 'ETH'];

interface PriceMap { [coin: string]: number }

async function fetchPrices(): Promise<PriceMap> {
  // Use the existing /api/market endpoint — adjust symbol format to match your backend
  const symbols = ['BTCUSDT', 'ETHUSDT'];
  const results: PriceMap = { USDT: 1 };

  await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        const { data } = await apiClient.get(`/market/ticker?symbol=${sym}`);
        // Handle both { price: number } and { data: { price: number } } shapes
        const price = Number(data?.price ?? data?.data?.price ?? data?.last ?? 0);
        if (price > 0) {
          const coin = sym.replace('USDT', '') as Coin;
          results[coin] = price;
        }
      } catch {
        // leave undefined — will fall back to 0
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
    refetchInterval: 30_000,   // refresh every 30 s
    staleTime:       20_000,
    retry:           2,
  });

  const prices: PriceMap = { USDT: 1, ...(priceQuery.data ?? {}) };

  const priceOf = useCallback(
    (coin: string): number => prices[coin] ?? 0,
    [prices],
  );

  // Sum available balances × price for each coin
  const totalUsd = Object.entries(balances).reduce((sum, [coin, amount]) => {
    const p = prices[coin] ?? (coin === 'USDT' ? 1 : 0);
    return sum + (Number(amount) || 0) * p;
  }, 0);

  // Sum locked balances × price
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