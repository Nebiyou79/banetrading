// hooks/useMarketTicker.ts
// ── TICKER HOOK (TanStack Query) ──
// Uses internal API. Cache-first with WebSocket updates.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTicker } from '@/lib/market-api';
import { useMarketStore } from '@/stores/market.store';
import type { AssetClass, NormalizedTicker } from '@/types/markets';

export interface UseMarketTickerOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export interface UseMarketTickerReturn {
  ticker: NormalizedTicker | null;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarketTicker(
  symbol: string,
  assetClass: AssetClass = 'crypto',
  options?: UseMarketTickerOptions,
): UseMarketTickerReturn {
  const queryClient = useQueryClient();

  // Get WebSocket live price from Zustand store
  const wsTicker = useMarketStore((s: { tickers: { [x: string]: any; }; }) => s.tickers[symbol]);
  const wsPrice = useMarketStore((s: { prices: { [x: string]: any; }; }) => s.prices[symbol]);

  const query = useQuery<NormalizedTicker>({
    queryKey: ['ticker', symbol, assetClass],
    queryFn: () => fetchTicker(symbol, assetClass),
    staleTime: 2_000,              // Re-fetch after 2s (matches Redis TTL)
    gcTime: 30_000,                // Keep in memory 30s after last use
    refetchInterval: options?.refetchInterval ?? 5_000, // Poll as WS fallback
    enabled: options?.enabled ?? !!symbol,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Merge WebSocket data with query data
  // WS data is more recent, use it if available
  const ticker = wsTicker || query.data || null;
  const price = wsPrice ?? ticker?.price ?? null;

  return {
    ticker,
    price,
    change24h: ticker?.change24h ?? null,
    high24h: ticker?.high24h ?? null,
    low24h: ticker?.low24h ?? null,
    isLoading: query.isLoading && !ticker,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}