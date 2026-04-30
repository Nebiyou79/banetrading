// hooks/useOhlc.ts
// ── OHLC CHART DATA HOOK ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import type { OhlcCandle, Timeframe } from '@/types/markets';

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
  candles: OhlcCandle[];
  source: string;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOhlc(
  symbol: string,
  interval: Timeframe = '1h',
  limit: number = 500,
): UseOhlcReturn {
  const refetchInterval = REFETCH_INTERVAL_BY_TF[interval] ?? 60_000;
  const staleTime = refetchInterval ? refetchInterval * 0.8 : 30_000;

  const query = useQuery({
    queryKey: ['ohlc', symbol.toUpperCase(), interval, limit],
    queryFn: () => marketsService.getOhlc(symbol, interval, limit),
    refetchInterval,
    staleTime,
    enabled: !!symbol,
    retry: 1,         // Only retry once
    retryDelay: 2000, // Wait 2s before retry
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