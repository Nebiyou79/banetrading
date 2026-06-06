// hooks/useMarketCandles.ts
// ── CANDLES HOOK (TanStack Query) ──
// Uses marketsService directly — avoids broken /api/chart route.
// For crypto: hits /markets/${symbol}/ohlc (same as useOhlc, known working)
// For forex/metals: hits /chart with assetClass param as fallback

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import type { AssetClass, NormalizedCandle } from '@/types/markets';

export interface UseMarketCandlesOptions {
  enabled?: boolean;
  limit?: number;
}

async function fetchCandlesViaService(
  symbol: string,
  interval: string,
  assetClass: AssetClass,
  limit: number,
): Promise<NormalizedCandle[]> {
  if (assetClass === 'crypto') {
    // Use the proven /markets/${symbol}/ohlc endpoint (same as useOhlc)
    const res = await marketsService.getOhlc(symbol, interval as any, limit);
    // getOhlc returns OhlcResponse — normalise to NormalizedCandle[]
    const candles = (res as any).candles ?? (res as any).data ?? res;
    if (!Array.isArray(candles) || candles.length === 0) {
      throw new Error('No candle data returned');
    }
    return candles as NormalizedCandle[];
  }

  // forex / metals — try the unified /chart endpoint
  return marketsService.getChartCandles(symbol, interval, assetClass, limit);
}

export function useMarketCandles(
  symbol: string,
  interval: string,
  assetClass: AssetClass = 'crypto',
  options?: UseMarketCandlesOptions,
) {
  return useQuery({
    queryKey: ['candles', symbol, interval, assetClass],
    queryFn: () =>
      fetchCandlesViaService(symbol, interval, assetClass, options?.limit ?? 300),
    staleTime: 15_000,
    gcTime: 60_000,
    enabled: options?.enabled ?? !!symbol,
    retry: 1,
    retryDelay: 2000,
  });
}
