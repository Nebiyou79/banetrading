// hooks/usePlaceTrade.ts
// ── PLACE TRADE MUTATION ──

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import { ACTIVE_TRADES_KEY } from './useActiveTrades';
import { BALANCES_KEY } from './useUserBalances';
import type { PlaceTradeRequest, PlaceTradeResponse } from '@/types/trade';
import { normalizeError } from '@/services/apiClient';

export interface UsePlaceTradeReturn {
  placeTrade: (payload: PlaceTradeRequest) => Promise<PlaceTradeResponse>;
  isPending: boolean;
  error: string | null;
  reset: () => void;
}

export function usePlaceTrade(): UsePlaceTradeReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation<PlaceTradeResponse, unknown, PlaceTradeRequest>({
    mutationFn: (payload) => tradeService.placeTrade(payload),
    onSuccess: () => {
      // Refresh active list + balances immediately so countdown appears.
      queryClient.invalidateQueries({ queryKey: ACTIVE_TRADES_KEY });
      queryClient.invalidateQueries({ queryKey: BALANCES_KEY });
    },
  });

  return {
    placeTrade: (payload) => mutation.mutateAsync(payload),
    isPending: mutation.isPending,
    error: mutation.error ? normalizeError(mutation.error).message : null,
    reset: () => mutation.reset(),
  };
}