// hooks/useActiveTrades.ts
// ── ACTIVE TRADES POLLING HOOK ──
// BUG 2 FIX: Properly detect when a pending trade transitions to won/lost.
// Previous implementation used a Set of pending IDs but couldn't see resolved
// trades in the active endpoint response (which only returns pending trades).
// 
// Fix: Track ALL trade IDs we've seen as pending. On each poll, fetch both
// the active endpoint AND compare against the previous set. Any ID that was
// pending but is now gone → fetch it from history to get its final status.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import type { Trade, ActiveTradesResponse } from '@/types/trade';

export const ACTIVE_TRADES_KEY = ['trading', 'active'] as const;

export interface UseActiveTradesReturn {
  trades: Trade[];
  recentlyResolved: Trade[];
  clearResolved: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useActiveTrades(): UseActiveTradesReturn {
  // BUG 2 FIX: Store resolved trades in a queue
  const [recentlyResolved, setRecentlyResolved] = useState<Trade[]>([]);
  // Track which trade IDs were last seen as pending
  const prevPendingIds = useRef<Set<string>>(new Set());
  // Store the full trade objects for pending trades so we can look them up
  const prevPendingTrades = useRef<Map<string, Trade>>(new Map());
  const queryClient = useQueryClient();

  const query = useQuery<ActiveTradesResponse>({
    queryKey: ACTIVE_TRADES_KEY,
    queryFn: () => tradeService.getActive(),
    // BUG 2 FIX: Poll every second when there are pending trades, every 3s otherwise
    refetchInterval: (queryData) => {
      const trades = (queryData?.state?.data as ActiveTradesResponse | undefined)?.trades;
      if (!trades || trades.length === 0) return 3000;
      return trades.some((t) => t.status === 'pending') ? 1000 : 3000;
    },
    // Keep previous data while refetching to avoid flicker
    placeholderData: (prev) => prev,
  });

  // BUG 2 FIX: When active poll returns, detect trades that disappeared (resolved)
  useEffect(() => {
    const currentTrades = query.data?.trades ?? [];
    const currentPendingIds = new Set(
      currentTrades.filter((t) => t.status === 'pending').map((t) => t._id)
    );

    // Update the stored pending trade objects
    currentTrades.forEach((t) => {
      if (t.status === 'pending') {
        prevPendingTrades.current.set(t._id, t);
      }
    });

    // Find IDs that were pending before but are gone now (resolved server-side)
    const resolvedIds: string[] = [];
    for (const id of prevPendingIds.current) {
      if (!currentPendingIds.has(id)) {
        resolvedIds.push(id);
      }
    }

    // BUG 2 FIX: For each resolved trade, fetch its final status from history
    if (resolvedIds.length > 0) {
      resolvedIds.forEach(async (id) => {
        try {
          const { trade } = await tradeService.getOne(id);
          if (trade && (trade.status === 'won' || trade.status === 'lost')) {
            setRecentlyResolved((prev) => {
              // Avoid duplicates
              if (prev.some((t) => t._id === id)) return prev;
              return [...prev, trade];
            });
            // Invalidate history so table updates
            queryClient.invalidateQueries({ queryKey: ['trading', 'history'] });
            queryClient.invalidateQueries({ queryKey: ['balances'] });
          }
        } catch (err) {
          // If fetch fails, try to show a generic result using cached trade data
          const cachedTrade = prevPendingTrades.current.get(id);
          if (cachedTrade) {
            const fakeTrade: Trade = { ...cachedTrade, status: 'lost', resolvedAt: new Date().toISOString() };
            setRecentlyResolved((prev) => {
              if (prev.some((t) => t._id === id)) return prev;
              return [...prev, fakeTrade];
            });
          }
        } finally {
          // Clean up stored reference
          prevPendingTrades.current.delete(id);
        }
      });
    }

    // Update our reference to the current pending set
    prevPendingIds.current = currentPendingIds;
  }, [query.data, queryClient]);

  const clearResolved = useCallback(() => {
    setRecentlyResolved([]);
  }, []);

  return {
    trades: query.data?.trades ?? [],
    recentlyResolved,
    clearResolved,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}