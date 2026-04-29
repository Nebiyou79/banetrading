// hooks/useConversionHistory.ts
// ── CONVERSION HISTORY HOOK ──

import { useQuery } from '@tanstack/react-query';
import { conversionService } from '@/services/conversionService';
import type { ConversionRecord } from '@/types/convert';

export interface UseConversionHistoryReturn {
  conversions: ConversionRecord[];
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useConversionHistory(limit = 20): UseConversionHistoryReturn {
  const query = useQuery({
    queryKey: ['conversion-history', limit],
    queryFn: () => conversionService.getHistory(limit),
    staleTime: 15_000,
  });

  return {
    conversions: query.data?.conversions ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}