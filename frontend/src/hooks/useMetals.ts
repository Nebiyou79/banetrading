// hooks/useMetals.ts
// ── METALS LIST HOOK ──

import { useQuery } from '@tanstack/react-query';
import { marketsService } from '@/services/marketsService';
import type { ForexRow } from '@/types/markets';

export interface UseMetalsReturn {
  rows: ForexRow[];
  source: string;
  stale: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMetals(): UseMetalsReturn {
  const query = useQuery({
    queryKey: ['markets', 'metals'],
    queryFn: () => marketsService.getMetals(),
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