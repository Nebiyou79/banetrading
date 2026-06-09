// hooks/useActiveTrades.ts
// ── ACTIVE TRADES POLLING HOOK ──
// FIX: invalidateQueries was using ['balances'] but BALANCE_QUERY_KEY is ['balance']
//      (no "s") — the invalidation never triggered a balance refetch.
//      Now imports and uses BALANCE_QUERY_KEY directly to avoid this mismatch.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import { BALANCE_QUERY_KEY } from './useBalance';   // ← single source of truth for the key
import type { Trade, ActiveTradesResponse } from '@/types/trade';

export const ACTIVE_TRADES_KEY = ['trading', 'active'] as const;

export interface UseActiveTradesReturn {
  trades:           Trade[];
  recentlyResolved: Trade[];
  clearResolved:    () => void;
  isLoading:        boolean;
  error:            string | null;
}

export function useActiveTrades(): UseActiveTradesReturn {
  const [recentlyResolved, setRecentlyResolved] = useState<Trade[]>([]);
  const prevPendingIds    = useRef<Set<string>>(new Set());
  const prevPendingTrades = useRef<Map<string, Trade>>(new Map());
  const queryClient       = useQueryClient();

  const query = useQuery<ActiveTradesResponse>({
    queryKey: ACTIVE_TRADES_KEY,
    queryFn:  () => tradeService.getActive(),
    refetchInterval: (queryData) => {
      const trades = (queryData?.state?.data as ActiveTradesResponse | undefined)?.trades;
      if (!trades || trades.length === 0) return 3000;
      return trades.some((t) => t.status === 'pending') ? 1000 : 3000;
    },
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    const currentTrades     = query.data?.trades ?? [];
    const currentPendingIds = new Set(
      currentTrades.filter((t) => t.status === 'pending').map((t) => t._id)
    );

    currentTrades.forEach((t) => {
      if (t.status === 'pending') prevPendingTrades.current.set(t._id, t);
    });

    const resolvedIds: string[] = [];
    for (const id of prevPendingIds.current) {
      if (!currentPendingIds.has(id)) resolvedIds.push(id);
    }

    if (resolvedIds.length > 0) {
      resolvedIds.forEach(async (id) => {
        try {
          const { trade } = await tradeService.getOne(id);
          if (trade && (trade.status === 'won' || trade.status === 'lost')) {
            setRecentlyResolved((prev) => {
              if (prev.some((t) => t._id === id)) return prev;
              return [...prev, trade];
            });

            // FIX: use BALANCE_QUERY_KEY (['balance']) not ['balances']
            // Previously this was a typo — ['balances'] never matched anything
            queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['trading', 'history'] });
          }
        } catch {
          const cachedTrade = prevPendingTrades.current.get(id);
          if (cachedTrade) {
            const fakeTrade: Trade = {
              ...cachedTrade,
              status:     'lost',
              resolvedAt: new Date().toISOString(),
            };
            setRecentlyResolved((prev) => {
              if (prev.some((t) => t._id === id)) return prev;
              return [...prev, fakeTrade];
            });
          }
        } finally {
          prevPendingTrades.current.delete(id);
        }
      });
    }

    prevPendingIds.current = currentPendingIds;
  }, [query.data, queryClient]);

  const clearResolved = useCallback(() => {
    setRecentlyResolved([]);
    // FIX: also invalidate balance when modal is dismissed so balance
    // refreshes immediately if the 5s poll hasn't fired yet
    queryClient.invalidateQueries({ queryKey: BALANCE_QUERY_KEY });
  }, [queryClient]);

  return {
    trades:           query.data?.trades ?? [],
    recentlyResolved,
    clearResolved,
    isLoading:        query.isLoading,
    error:            query.error ? (query.error as Error).message : null,
  };
}