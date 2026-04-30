// hooks/useTradingConfig.ts
// ── TRADING CONFIG HOOK (active plans, fee, enabled pairs) ──

import { useQuery } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import type { TradingConfigResponse } from '@/types/trade';

export const TRADING_CONFIG_KEY = ['trading', 'config'] as const;

export interface UseTradingConfigReturn {
  config: TradingConfigResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTradingConfig(): UseTradingConfigReturn {
  const query = useQuery<TradingConfigResponse>({
    queryKey: TRADING_CONFIG_KEY,
    queryFn: () => tradeService.getConfig(),
    staleTime: 60_000,
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}