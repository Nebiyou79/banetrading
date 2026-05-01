// hooks/usePlaceTrade.ts
// ── PLACE TRADE MUTATION ──
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import type { PlaceTradeRequest, PlaceTradeResponse } from '@/types/trade';

export function usePlaceTrade() {
  const queryClient = useQueryClient();

  return useMutation<PlaceTradeResponse, Error, PlaceTradeRequest>({
    mutationFn: (payload) => tradeService.placeTrade(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'history'] });
    },
  });
}