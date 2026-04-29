// hooks/useDepositAddresses.ts
// ── Deposit address book query + admin mutation ──

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { depositAddressService } from '@/services/depositAddressService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import type {
  DepositAddresses,
  DepositAddressesResponse,
} from '@/types/funds';

export const DEPOSIT_ADDRESSES_QUERY_KEY = ['deposit-addresses'] as const;

const EMPTY_ADDRESSES: DepositAddresses = {
  'USDT-ERC20': '',
  'USDT-TRC20': '',
  'USDT-BEP20': '',
  BTC:          '',
  ETH:          '',
};

export interface UseDepositAddressesReturn {
  addresses: DepositAddresses;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (partial: Partial<DepositAddresses>) => Promise<DepositAddressesResponse>;
  isUpdating: boolean;
}

export function useDepositAddresses(): UseDepositAddressesReturn {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery<DepositAddressesResponse>({
    queryKey: DEPOSIT_ADDRESSES_QUERY_KEY,
    queryFn: async () => depositAddressService.getAddresses(),
    enabled: hasToken,
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (partial: Partial<DepositAddresses>) =>
      depositAddressService.updateAddresses(partial),
    // Optimistic merge with rollback
    onMutate: async (partial) => {
      await queryClient.cancelQueries({ queryKey: DEPOSIT_ADDRESSES_QUERY_KEY });
      const previous = queryClient.getQueryData<DepositAddressesResponse>(DEPOSIT_ADDRESSES_QUERY_KEY);
      if (previous) {
        const merged: DepositAddressesResponse = {
          ...previous,
          addresses: { ...previous.addresses, ...partial },
        };
        queryClient.setQueryData(DEPOSIT_ADDRESSES_QUERY_KEY, merged);
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(DEPOSIT_ADDRESSES_QUERY_KEY, ctx.previous);
    },
    onSuccess: (resp) => {
      queryClient.setQueryData(DEPOSIT_ADDRESSES_QUERY_KEY, {
        addresses: resp.addresses,
        updatedAt: resp.updatedAt,
      });
    },
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const update = useCallback(async (partial: Partial<DepositAddresses>) => {
    try { return await mutation.mutateAsync(partial); }
    catch (err) { throw normalizeError(err); }
  }, [mutation]);

  const data = query.data;
  return {
    addresses: data?.addresses ?? EMPTY_ADDRESSES,
    updatedAt: data?.updatedAt ?? null,
    isLoading: hasToken && query.isLoading,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
    update,
    isUpdating: mutation.isPending,
  };
}