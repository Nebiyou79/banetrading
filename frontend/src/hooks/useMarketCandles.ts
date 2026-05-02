// hooks/useMarketCandles.ts
// ── CANDLES HOOK (TanStack Query) ──
// Fetches OHLC data via internal /api/chart route.

import { useQuery } from '@tanstack/react-query';
import { fetchCandles } from '@/lib/market-api';
import type { AssetClass } from '@/types/markets';

export interface UseMarketCandlesOptions {
  enabled?: boolean;
  limit?: number;
}

export function useMarketCandles(
  symbol: string,
  interval: string,
  assetClass: AssetClass = 'crypto',
  options?: UseMarketCandlesOptions,
) {
  return useQuery({
    queryKey: ['candles', symbol, interval, assetClass],
    queryFn: () => fetchCandles(symbol, interval, assetClass, options?.limit ?? 300),
    staleTime: 15_000,            // Matches Redis candle TTL
    gcTime: 60_000,
    enabled: options?.enabled ?? !!symbol,
    retry: 1,
    retryDelay: 2000,
  });
}