// hooks/useForex.ts
// ── FOREX LIST HOOK (UPDATED WITH WS INTEGRATION) ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import { useMarketStore } from '@/stores/market.store';
import type { ForexRow } from '@/types/markets';

export interface UseForexReturn {
  rows: ForexRow[];
  source: string;
  stale: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useForex(): UseForexReturn {
  // Get WebSocket live prices
  const wsPrices = useMarketStore((s: { prices: any; }) => s.prices);
  const wsTickers = useMarketStore((s: { tickers: any; }) => s.tickers);

  const query = useQuery({
    queryKey: ['markets', 'forex'],
    queryFn: () => marketsService.getForex(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });

  // Merge WS prices into rows
  const rows = query.data?.rows ?? [];
  const mergedRows = rows.map((row) => {
    const wsPrice = wsPrices[row.symbol];
    const wsTicker = wsTickers[row.symbol];

    return {
      ...row,
      price: wsPrice ?? row.price,
      change24h: wsTicker?.change24h ?? row.change24h,
      high24h: wsTicker?.high24h ?? row.high24h,
      low24h: wsTicker?.low24h ?? row.low24h,
    };
  });

  return {
    rows: mergedRows,
    source: query.data?.source ?? 'unknown',
    stale: query.data?.stale ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}