// hooks/usePromoLeaderboard.ts
// ── PROMO LEADERBOARD HOOK ──

import { useQuery } from '@tanstack/react-query';
import { promoService } from '@/services/promoService';
import type { LeaderboardEntry } from '@/types/promo';

export function usePromoLeaderboard() {
  const query = useQuery({
    queryKey: ['promo', 'leaderboard'],
    queryFn: () => promoService.getLeaderboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    leaderboard: query.data?.leaderboard ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}