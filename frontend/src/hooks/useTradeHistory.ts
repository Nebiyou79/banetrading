// hooks/useTradeHistory.ts
// ── TRADE HISTORY HOOK (paginated) ──

import { useQuery } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import type { TradeHistoryResponse } from '@/types/trade';

export const TRADE_HISTORY_KEY = (limit: number, offset: number) =>
  ['trading', 'history', limit, offset] as const;

export interface UseTradeHistoryReturn {
  trades: TradeHistoryResponse['trades'];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTradeHistory(limit = 20, offset = 0): UseTradeHistoryReturn {
  const query = useQuery<TradeHistoryResponse>({
    queryKey: TRADE_HISTORY_KEY(limit, offset),
    queryFn: () => tradeService.getHistory(limit, offset),
    staleTime: 5_000,
  });

  return {
    trades: query.data?.trades ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}