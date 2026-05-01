// hooks/useMyReferrals.ts
// ── MY REFERRALS HOOK ──

import { useQuery } from '@tanstack/react-query';
import { promoService } from '@/services/promoService';
import type { MyReferral } from '@/types/promo';

export function useMyReferrals(limit = 20) {
  const query = useQuery({
    queryKey: ['promo', 'referrals', limit],
    queryFn: () => promoService.getMyReferrals(limit),
    staleTime: 30_000,
  });

  return {
    referrals: query.data?.referrals ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}