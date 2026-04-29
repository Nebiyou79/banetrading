// hooks/useKyc.ts
// ── KYC status query + submit mutations ──

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kycService } from '@/services/kycService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { ME_QUERY_KEY } from './useAuth';
import { PROFILE_QUERY_KEY } from './useProfile';
import type {
  KycStatusResponse,
  KycSubmitLevel2Input,
  KycSubmitLevel2Response,
  KycSubmitLevel3Input,
  KycSubmitLevel3Response,
} from '@/types/kyc';

export const KYC_STATUS_QUERY_KEY = ['kyc', 'status'] as const;

export interface UseKycReturn {
  status: KycStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submitLevel2: (input: KycSubmitLevel2Input) => Promise<KycSubmitLevel2Response>;
  isSubmittingLevel2: boolean;
  submitLevel3: (input: KycSubmitLevel3Input) => Promise<KycSubmitLevel3Response>;
  isSubmittingLevel3: boolean;
}

export function useKyc(): UseKycReturn {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery<KycStatusResponse>({
    queryKey: KYC_STATUS_QUERY_KEY,
    queryFn: async () => kycService.getStatus(),
    enabled: hasToken,
    staleTime: 30 * 1000,
  });

  const invalidateAll = (): void => {
    queryClient.invalidateQueries({ queryKey: KYC_STATUS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };

  const level2Mutation = useMutation({
    mutationFn: async (input: KycSubmitLevel2Input) => kycService.submitLevel2(input),
    onSuccess: invalidateAll,
  });

  const level3Mutation = useMutation({
    mutationFn: async (input: KycSubmitLevel3Input) => kycService.submitLevel3(input),
    onSuccess: invalidateAll,
  });

  const submitLevel2 = useCallback(async (input: KycSubmitLevel2Input) => {
    try { return await level2Mutation.mutateAsync(input); }
    catch (err) { throw normalizeError(err); }
  }, [level2Mutation]);

  const submitLevel3 = useCallback(async (input: KycSubmitLevel3Input) => {
    try { return await level3Mutation.mutateAsync(input); }
    catch (err) { throw normalizeError(err); }
  }, [level3Mutation]);

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    status: (query.data ?? null) as KycStatusResponse | null,
    isLoading: hasToken && query.isLoading,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
    submitLevel2,
    isSubmittingLevel2: level2Mutation.isPending,
    submitLevel3,
    isSubmittingLevel3: level3Mutation.isPending,
  };
}