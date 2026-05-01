// hooks/useActiveTrades.ts
// ── ACTIVE TRADES POLLING HOOK ──
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const [recentlyResolved, setRecentlyResolved] = useState<Trade[]>([]);
  const prevPendingRef = useRef<Set<string>>(new Set());

  const query = useQuery<ActiveTradesResponse>({
    queryKey: ACTIVE_TRADES_KEY,
    queryFn: () => tradeService.getActive(),
    refetchInterval: (queryData) => {
      const trades = queryData?.state?.data?.trades;
      if (!trades || trades.length === 0) return false;
      return trades.some((t) => t.status === 'pending') ? 1000 : false;
    },
  });

  // Detect newly-resolved trades
  useEffect(() => {
    const trades = query.data?.trades ?? [];
    const currentPending = new Set(
      trades.filter((t) => t.status === 'pending').map((t) => t._id)
    );

    // Trades that were pending and are now resolved
    const newlyResolved: Trade[] = [];
    for (const id of prevPendingRef.current) {
      if (!currentPending.has(id)) {
        const resolved = trades.find((t) => t._id === id);
        if (resolved && resolved.status !== 'pending') {
          newlyResolved.push(resolved);
        }
      }
    }

    if (newlyResolved.length > 0) {
      setRecentlyResolved((prev) => [...prev, ...newlyResolved]);
    }

    prevPendingRef.current = currentPending;
  }, [query.data]);

  const clearResolved = () => setRecentlyResolved([]);

  return {
    trades: query.data?.trades ?? [],
    recentlyResolved,
    clearResolved,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}