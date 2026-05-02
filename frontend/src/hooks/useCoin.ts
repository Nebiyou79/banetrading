// hooks/useCoin.ts
// ── SINGLE COIN HOOK (UPDATED WITH WS PRICE INTEGRATION) ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import { useMarketStore } from '@/stores/market.store';
import type { MarketRow } from '@/types/markets';

export interface UseCoinReturn {
  row: MarketRow | null;
  source: string;
  stale: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCoin(symbol: string): UseCoinReturn {
  // Get WebSocket live price for this symbol
  const wsPrice = useMarketStore((s: { prices: { [x: string]: any; }; }) => s.prices[symbol]);
  const wsTicker = useMarketStore((s: { tickers: { [x: string]: any; }; }) => s.tickers[symbol]);

  const query = useQuery({
    queryKey: ['markets', symbol.toUpperCase()],
    queryFn: async () => {
      const resp = await marketsService.getCoin(symbol);
      return resp;
    },
    refetchInterval: 30_000,    // Reduced from 10s — WS handles real-time
    staleTime: 15_000,
    enabled: !!symbol,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Merge WS price into result if available
  const row = query.data?.row ?? null;
  const mergedRow = row
    ? {
        ...row,
        // Use WS price if available, fall back to API price
        price: wsPrice ?? row.price,
        // Use WS 24h change if available
        change24h: wsTicker?.change24h ?? row.change24h,
        high24h: wsTicker?.high24h ?? row.high24h,
        low24h: wsTicker?.low24h ?? row.low24h,
      }
    : null;

  return {
    row: mergedRow,
    source: query.data?.source ?? 'unknown',
    stale: query.data?.stale ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}