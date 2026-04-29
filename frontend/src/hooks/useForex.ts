// hooks/useForex.ts
// ── FOREX LIST HOOK ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
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
  const query = useQuery({
    queryKey: ['markets', 'forex'],
    queryFn: () => marketsService.getForex(),
    refetchInterval: 60_000,
    staleTime: 30_000,
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