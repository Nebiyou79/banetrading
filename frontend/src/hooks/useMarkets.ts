// hooks/useMarkets.ts
// ── MARKETS LIST HOOK (UPDATED WITH WS AWARENESS) ──
// TODO: switch to WS push for sub-second updates

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import { useMarketStore } from '@/stores/market.store';
import type { MarketsListResponse } from '@/types/markets';

export const MARKETS_LIST_KEY = ['markets', 'list'] as const;

export interface UseMarketsReturn {
  rows: MarketsListResponse['rows'];
  source: string;
  stale: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarkets(): UseMarketsReturn {
  // Get WebSocket live prices
  const wsPrices = useMarketStore((s: { prices: any; }) => s.prices);

  const query = useQuery<MarketsListResponse>({
    queryKey: MARKETS_LIST_KEY,
    queryFn: () => marketsService.getMarketsList(),
    refetchInterval: 60_000,    // 60s — WS handles real-time updates
    staleTime: 30_000,          // 30s — cache longer since WS updates
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Merge WS prices into rows for live price display
  const rows = query.data?.rows ?? [];
  const mergedRows = rows.map((row) => ({
    ...row,
    price: wsPrices[row.symbol] ?? row.price, // Use WS price if available
  }));

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