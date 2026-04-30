// hooks/useActiveTrades.ts
// ── ACTIVE TRADES HOOK ──
// Polls /api/trade/active every 2s. Detects trades that disappear from the
// active list (i.e. resolved) and exposes them as `recentlyResolved` so the
// UI can show TradeResultModal. Also exposes a queue helper.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, useCallback } from 'react';
import { tradeService } from '@/services/tradeService';
import type { ActiveTradesResponse, Trade } from '@/types/trade';

export const ACTIVE_TRADES_KEY = ['trading', 'active'] as const;

export interface UseActiveTradesReturn {
  trades: Trade[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  recentlyResolved: Trade[];
  consumeResolved: (id: string) => void;
}

export function useActiveTrades(pollMs = 2000): UseActiveTradesReturn {
  const queryClient = useQueryClient();

  const query = useQuery<ActiveTradesResponse>({
    queryKey: ACTIVE_TRADES_KEY,
    queryFn: () => tradeService.getActive(),
    refetchInterval: pollMs,
    staleTime: 0,
  });

  const trades = query.data?.trades ?? [];

  const previousIdsRef = useRef<Set<string>>(new Set());
  const [recentlyResolved, setRecentlyResolved] = useState<Trade[]>([]);

  // Detect the difference between the previous active set and the current one.
  // Any id that was previously active but is now gone has resolved server-side —
  // fetch it once to capture its final shape and queue it for the result modal.
  useEffect(() => {
    if (query.isLoading) return;

    const currentIds = new Set(trades.map((t) => t._id));
    const removed: string[] = [];
    previousIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) removed.push(id);
    });

    if (removed.length > 0) {
      removed.forEach(async (id) => {
        try {
          const { trade } = await tradeService.getOne(id);
          if (trade && trade.status !== 'pending') {
            setRecentlyResolved((prev) => {
              if (prev.some((t) => t._id === trade._id)) return prev;
              return [...prev, trade];
            });
          }
        } catch {
          // ignore — it'll show in history anyway
        }
      });
      // Once trades resolve, refresh balances + history.
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['trading', 'history'] });
    }

    previousIdsRef.current = currentIds;
  }, [trades, query.isLoading, queryClient]);

  const consumeResolved = useCallback((id: string) => {
    setRecentlyResolved((prev) => prev.filter((t) => t._id !== id));
  }, []);

  return {
    trades,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
    recentlyResolved,
    consumeResolved,
  };
}