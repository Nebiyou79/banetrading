// hooks/useTradePairs.ts
// ── TRADING PAIRS HOOK (grouped by class) ──

import { useQuery } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import type { TradingPairsResponse } from '@/types/trade';

export const TRADING_PAIRS_KEY = ['trading', 'pairs'] as const;

export interface UseTradePairsReturn {
  pairs: TradingPairsResponse;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY: TradingPairsResponse = { crypto: [], forex: [], metals: [] };

export function useTradePairs(): UseTradePairsReturn {
  const query = useQuery<TradingPairsResponse>({
    queryKey: TRADING_PAIRS_KEY,
    queryFn: () => tradeService.getPairs(),
    staleTime: 60_000,
  });

  return {
    pairs: query.data ?? EMPTY,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}