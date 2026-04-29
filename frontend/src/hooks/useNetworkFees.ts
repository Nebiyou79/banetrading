// hooks/useNetworkFees.ts
// ── Network fee query + admin mutation ──

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { networkFeeService } from '@/services/networkFeeService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type {
  NetworkFees,
  NetworkFeesResponse,
  UpdateFeeResponse,
  WithdrawNetwork,
} from '@/types/funds';

export const NETWORK_FEES_QUERY_KEY = ['network-fees'] as const;

const EMPTY_FEES: NetworkFees = {
  'USDT-ERC20': null,
  'USDT-TRC20': null,
  'USDT-BEP20': null,
  BTC:          null,
  ETH:          null,
};

export interface UseNetworkFeesReturn {
  fees: NetworkFees;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (network: WithdrawNetwork, fee: number) => Promise<UpdateFeeResponse>;
  isUpdating: boolean;
  feeFor: (network: WithdrawNetwork) => number | null;
}

export function useNetworkFees(): UseNetworkFeesReturn {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery<NetworkFeesResponse>({
    queryKey: NETWORK_FEES_QUERY_KEY,
    queryFn: async () => networkFeeService.getAllFees(),
    enabled: hasToken,
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (vars: { network: WithdrawNetwork; fee: number }) =>
      networkFeeService.updateFee(vars.network, vars.fee),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: NETWORK_FEES_QUERY_KEY });
      const previous = queryClient.getQueryData<NetworkFeesResponse>(NETWORK_FEES_QUERY_KEY);
      if (previous) {
        const merged: NetworkFeesResponse = {
          fees: { ...previous.fees, [vars.network]: vars.fee },
        };
        queryClient.setQueryData(NETWORK_FEES_QUERY_KEY, merged);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(NETWORK_FEES_QUERY_KEY, ctx.previous);
    },
    onSuccess: (resp) => {
      const previous = queryClient.getQueryData<NetworkFeesResponse>(NETWORK_FEES_QUERY_KEY);
      const next: NetworkFeesResponse = {
        fees: { ...(previous?.fees ?? EMPTY_FEES), [resp.network]: resp.fee },
      };
      queryClient.setQueryData(NETWORK_FEES_QUERY_KEY, next);
    },
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const update = useCallback(async (network: WithdrawNetwork, fee: number) => {
    try { return await mutation.mutateAsync({ network, fee }); }
    catch (err) { throw normalizeError(err); }
  }, [mutation]);

  const fees = query.data?.fees ?? EMPTY_FEES;
  const feeFor = useCallback(
    (network: WithdrawNetwork): number | null => fees[network] ?? null,
    [fees],
  );

  return {
    fees,
    isLoading: hasToken && query.isLoading,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
    update,
    isUpdating: mutation.isPending,
    feeFor,
  };
}