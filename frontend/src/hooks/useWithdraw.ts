// hooks/useWithdraw.ts
// ── Withdrawal submission + history ──
//
// BALANCE FIX:
// 1. After successful withdrawal submission, invalidates ['balance'] so
//    the UI immediately reflects the deducted available balance and new
//    locked balance without waiting for the next polling interval.
// 2. SubmitWithdrawResponse now includes `lockedBalances` from the server,
//    which the type system is updated to reflect (see types/funds.ts).

import { useCallback }       from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withdrawService }   from '@/services/withdrawService';
import { normalizeError }    from '@/services/apiClient';
import { tokenStore }        from '@/lib/tokenStore';
import { BALANCE_QUERY_KEY } from './useBalance';
import { PORTFOLIO_QUERY_KEY } from './usePortfolio';
import type {
  SubmitWithdrawInput,
  SubmitWithdrawResponse,
  WithdrawalRecord,
  WithdrawalsListResponse,
} from '@/types/funds';

export const myWithdrawalsKey = (limit: number, skip: number) =>
  ['withdrawals', 'me', limit, skip] as const;

export interface UseWithdrawReturn {
  withdrawals:  WithdrawalRecord[];
  total:        number;
  isLoading:    boolean;
  error:        string | null;
  submit:       (input: SubmitWithdrawInput) => Promise<SubmitWithdrawResponse>;
  isSubmitting: boolean;
  refetch:      () => Promise<void>;
}

export function useWithdraw(limit = 20, skip = 0): UseWithdrawReturn {
  const queryClient = useQueryClient();
  const hasToken    = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery<WithdrawalsListResponse>({
    queryKey: myWithdrawalsKey(limit, skip),
    queryFn:  () => withdrawService.getMyWithdrawals(limit, skip),
    enabled:  hasToken,
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: (input: SubmitWithdrawInput) => withdrawService.submitWithdraw(input),
    onSuccess: () => {
      // Invalidate withdrawal history list
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'me'] });
      // BALANCE FIX: force-refresh balance so available and locked amounts
      // update immediately in BalanceHero, asset grid, and WithdrawModal
      queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'recent'] });
    },
  });

  const submit = useCallback(async (input: SubmitWithdrawInput) => {
    try { return await submitMutation.mutateAsync(input); }
    catch (err) { throw normalizeError(err); }
  }, [submitMutation]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    withdrawals:  query.data?.withdrawals ?? [],
    total:        query.data?.total       ?? 0,
    isLoading:    hasToken && query.isLoading,
    error:        query.error ? normalizeError(query.error).message : null,
    submit,
    isSubmitting: submitMutation.isPending,
    refetch,
  };
}