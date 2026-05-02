// hooks/useOhlc.ts
// ── OHLC CHART DATA HOOK (UPDATED WITH NEW CHART API) ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import type { OhlcCandle, Timeframe, AssetClass } from '@/types/markets';

// ── Longer refetch intervals to avoid rate limiting ──
const REFETCH_INTERVAL_BY_TF: Record<Timeframe, number | false> = {
  '1m':  30_000,
  '5m':  30_000,
  '15m': 60_000,
  '1h':  60_000,
  '4h':  120_000,   // 2 minutes
  '1d':  300_000,   // 5 minutes
  '1w':  600_000,   // 10 minutes
};

export interface UseOhlcReturn {
  candles: OhlcCandle[];   // ← Direct property, NOT nested under data
  source: string;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Determine asset class from symbol.
 * Falls back to legacy API if asset class cannot be determined.
 */
function getAssetClass(symbol: string): AssetClass {
  const upper = symbol.toUpperCase();

  // Metals: XAUUSD, XAGUSD
  if (upper.startsWith('XA')) return 'metals';

  // Forex: EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD'];
  if (forexPairs.includes(upper)) return 'forex';

  return 'crypto';
}

export function useOhlc(
  symbol: string,
  interval: Timeframe = '1h',
  limit: number = 500,
): UseOhlcReturn {
  const refetchInterval = REFETCH_INTERVAL_BY_TF[interval] ?? 60_000;
  const staleTime = refetchInterval ? Number(refetchInterval) * 0.8 : 30_000;
  const assetClass = getAssetClass(symbol);

  const query = useQuery({
    queryKey: ['ohlc', symbol.toUpperCase(), interval, limit],
    queryFn: async () => {
      // Try new chart API first
      try {
        const candles = await marketsService.getChartCandles(
          symbol,
          interval,
          assetClass,
          limit,
        );
        return { candles, source: 'internal' };
      } catch {
        // Fall back to legacy OHLC endpoint
        const resp = await marketsService.getOhlc(symbol, interval, limit);
        return resp;
      }
    },
    refetchInterval,
    staleTime,
    enabled: !!symbol,
    retry: 1,
    retryDelay: 2000,
  });

  return {
    candles: query.data?.candles ?? [],
    source: query.data?.source ?? 'unknown',
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}