// hooks/useOhlc.ts
// ── OHLC CHART DATA HOOK ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import type { OhlcCandle, Timeframe } from '@/types/markets';

const REFETCH_INTERVAL_BY_TF: Record<Timeframe, number> = {
  '1m':  15_000,
  '5m':  15_000,
  '15m': 30_000,
  '1h':  30_000,
  '4h':  60_000,
  '1d':  60_000,
  '1w':  60_000,
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
  const query = useQuery({
    queryKey: ['ohlc', symbol.toUpperCase(), interval, limit],
    queryFn: () => marketsService.getOhlc(symbol, interval, limit),
    refetchInterval: REFETCH_INTERVAL_BY_TF[interval] || 30_000,
    staleTime: REFETCH_INTERVAL_BY_TF[interval]
      ? REFETCH_INTERVAL_BY_TF[interval] * 0.5
      : 15_000,
    enabled: !!symbol,
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