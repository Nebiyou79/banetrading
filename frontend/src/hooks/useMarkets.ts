// hooks/useMarkets.ts
// ── MARKETS LIST HOOK ──
// TODO: switch to WS push for sub-second updates

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
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
  const query = useQuery<MarketsListResponse>({
    queryKey: MARKETS_LIST_KEY,
    queryFn: () => marketsService.getMarketsList(),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  return {
    rows: query.data?.rows ?? [],
    source: query.data?.source ?? 'unknown',
    stale: query.data?.stale ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}