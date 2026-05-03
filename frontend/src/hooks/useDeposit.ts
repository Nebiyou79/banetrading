// hooks/useDeposit.ts
// ── Deposit submission + history ──
//
// BALANCE FIX:
// Invalidates ['balance'] query key (from useBalance) as well as the
// portfolio key after a successful deposit submission, ensuring the
// balance displayed in BalanceHero and the asset grid reflects the
// updated state without requiring a manual page refresh.

import { useCallback }       from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depositService }    from '@/services/depositService';
import { normalizeError }    from '@/services/apiClient';
import { tokenStore }        from '@/lib/tokenStore';
import { BALANCE_QUERY_KEY } from './useBalance';
import { PORTFOLIO_QUERY_KEY } from './usePortfolio';
import type {
  DepositRecord,
  DepositsListResponse,
  SubmitDepositInput,
  SubmitDepositResponse,
} from '@/types/funds';

export const myDepositsKey = (limit: number, skip: number) =>
  ['deposits', 'me', limit, skip] as const;

export interface UseDepositReturn {
  deposits:     DepositRecord[];
  total:        number;
  isLoading:    boolean;
  error:        string | null;
  submit:       (input: SubmitDepositInput) => Promise<SubmitDepositResponse>;
  isSubmitting: boolean;
  refetch:      () => Promise<void>;
}

export function useDeposit(limit = 20, skip = 0): UseDepositReturn {
  const queryClient = useQueryClient();
  const hasToken    = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery<DepositsListResponse>({
    queryKey: myDepositsKey(limit, skip),
    queryFn:  () => depositService.getMyDeposits(limit, skip),
    enabled:  hasToken,
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: (input: SubmitDepositInput) => depositService.submitDeposit(input),
    onSuccess: () => {
      // Invalidate deposit history list
      queryClient.invalidateQueries({ queryKey: ['deposits', 'me'] });
      // BALANCE FIX: also invalidate the unified balance cache so BalanceHero
      // and the asset grid refresh after a deposit is submitted
      queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'recent'] });
    },
  });

  const submit = useCallback(async (input: SubmitDepositInput) => {
    try { return await submitMutation.mutateAsync(input); }
    catch (err) { throw normalizeError(err); }
  }, [submitMutation]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    deposits:     query.data?.deposits ?? [],
    total:        query.data?.total    ?? 0,
    isLoading:    hasToken && query.isLoading,
    error:        query.error ? normalizeError(query.error).message : null,
    submit,
    isSubmitting: submitMutation.isPending,
    refetch,
  };
}