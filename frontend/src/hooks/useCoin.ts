// hooks/useCoin.ts
// ── SINGLE COIN HOOK ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
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
  const query = useQuery({
    queryKey: ['markets', symbol.toUpperCase()],
    queryFn: async () => {
      const resp = await marketsService.getCoin(symbol);
      return resp;
    },
    refetchInterval: 10000,
    staleTime: 5000,
    enabled: !!symbol,
  });

  return {
    row: query.data?.row ?? null,
    source: query.data?.source ?? 'unknown',
    stale: query.data?.stale ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}