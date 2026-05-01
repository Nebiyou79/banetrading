// services/historyService.ts
// ── HISTORY API SERVICE ──

import { apiClient } from './apiClient';
import type { HistoryQueryParams, HistoryResponse } from '@/types/history';

export const historyService = {
  getHistory: async (params: HistoryQueryParams): Promise<HistoryResponse> => {
    const { data } = await apiClient.get<HistoryResponse>('/history', { params });
    return data;
  },
};