// hooks/useHistory.ts
// ── HISTORY HOOK WITH PAGINATION ──

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { historyService } from '@/services/historyService';
import type { HistoryItem, HistoryItemType } from '@/types/history';

interface UseHistoryParams {
  type?: HistoryItemType | 'all';
  status?: string;
  from?: string;
  to?: string;
}

export interface UseHistoryReturn {
  items: HistoryItem[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  loadMore: () => void;
  isLoadingMore: boolean;
  refetch: () => void;
}

const PAGE_SIZE = 20;

export function useHistory(params: UseHistoryParams = {}): UseHistoryReturn {
  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<HistoryItem[]>([]);

  const queryKey = ['history', params.type, params.status, params.from, params.to];

  const query = useQuery({
    queryKey: [...queryKey, offset],
    queryFn: async () => {
      const response = await historyService.getHistory({
        type: params.type || 'all',
        limit: PAGE_SIZE,
        offset,
        status: params.status,
        from: params.from,
        to: params.to,
      });
      return response;
    },
    staleTime: 15000,
  });

  // ── Reset when filters change ──
  const [prevKey, setPrevKey] = useState<string>('');
  const currentKey = JSON.stringify([params.type, params.status, params.from, params.to]);
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (offset !== 0) setOffset(0);
    if (allItems.length > 0) setAllItems([]);
  }

  // ── Append new items ──
  const [lastOffset, setLastOffset] = useState(-1);
  if (query.data && offset !== lastOffset) {
    setLastOffset(offset);
    if (offset === 0) {
      setAllItems(query.data.items);
    } else {
      setAllItems(prev => [...prev, ...query.data.items]);
    }
  }

  const loadMore = useCallback(() => {
    if (!query.data?.hasMore || query.isFetching) return;
    setOffset(prev => prev + PAGE_SIZE);
  }, [query.data?.hasMore, query.isFetching]);

  return {
    items: allItems,
    total: query.data?.total ?? 0,
    hasMore: query.data?.hasMore ?? false,
    isLoading: query.isLoading && offset === 0,
    isFetching: query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    loadMore,
    isLoadingMore: query.isFetching && offset > 0,
    refetch: () => query.refetch(),
  };
}