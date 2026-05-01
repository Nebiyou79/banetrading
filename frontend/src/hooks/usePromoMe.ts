// hooks/usePromoMe.ts
// ── EXTENDED PROMO STATS HOOK ──

import { useQuery } from '@tanstack/react-query';
import type { PromoStats } from '@/types/promo';
import { promoService } from '@/services/promoService';

export function usePromoMe() {
  const query = useQuery<PromoStats>({
    queryKey: ['promo', 'me'],
    queryFn: () => promoService.getMe(),
    staleTime: 60_000,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}