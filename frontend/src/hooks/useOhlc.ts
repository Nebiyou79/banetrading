// hooks/useOhlc.ts
// ── OHLC CHART DATA HOOK ──
// Updated: 60s staleTime (was too aggressive), 3 timeframes per asset class

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import type { OhlcCandle, Timeframe, AssetClass } from '@/types/markets';

// Conservative refetch intervals — avoid rate limiting
const REFETCH_INTERVAL_BY_TF: Record<string, number> = {
  '15m': 120_000,  // 2 minutes
  '1h':  120_000,  // 2 minutes
  '4h':  300_000,  // 5 minutes
  '1d':  600_000,  // 10 minutes
};

export interface UseOhlcReturn {
  candles: OhlcCandle[];
  source: string;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

function getAssetClass(symbol: string): AssetClass {
  const upper = symbol.toUpperCase();
  if (upper.startsWith('XA')) return 'metals';
  const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD'];
  if (forexPairs.includes(upper)) return 'forex';
  return 'crypto';
}

export function useOhlc(
  symbol: string,
  interval: Timeframe = '1h',
  limit: number = 300,
): UseOhlcReturn {
  const refetchInterval = REFETCH_INTERVAL_BY_TF[interval] ?? 120_000;
  const staleTime = 60_000; // 60s — matches backend Redis TTL
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
        if (candles && candles.length > 0) {
          return { candles, source: 'internal' };
        }
      } catch {
        // Fall through to legacy OHLC endpoint
      }
      // Fallback to legacy OHLC endpoint
      const resp = await marketsService.getOhlc(symbol, interval, limit);
      return resp;
    },
    refetchInterval,
    staleTime,
    enabled: !!symbol,
    retry: 1,
    retryDelay: 2000,
  });

  return {
    candles: query.data?.candles ?? [],
    source:  query.data?.source ?? 'unknown',
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}