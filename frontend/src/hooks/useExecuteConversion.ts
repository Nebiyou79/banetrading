// hooks/useExecuteConversion.ts
// ── EXECUTE CONVERSION MUTATION ──

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversionService } from '@/services/conversionService';
import { normalizeError } from '@/services/apiClient';
import type { Currency } from '@/types/convert';
import { BALANCES_KEY } from './useUserBalances';

interface ExecuteConversionPayload {
  from: Currency;
  to: Currency;
  fromAmount: number;
  quotedRate: number;
}

export interface ExecuteConversionResult {
  rate: number;
  fromAmount: number;
  toAmount: number;
  conversionId: string;
}

export function useExecuteConversion() {
  const queryClient = useQueryClient();

  return useMutation<ExecuteConversionResult, Error, ExecuteConversionPayload>({
    mutationFn: async (payload) => conversionService.executeConvert(payload),
    onSuccess: () => {
      // Invalidate balances + conversion history
      queryClient.invalidateQueries({ queryKey: BALANCES_KEY });
      queryClient.invalidateQueries({ queryKey: ['conversion-history'] });
    },
    onError: (err) => {
      throw normalizeError(err);
    },
  });
}