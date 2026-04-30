// services/tradeService.ts
// ── TRADING API SERVICE (Module 7) ──

import { apiClient } from './apiClient';
import type {
  TradingConfigResponse,
  TradingPairsResponse,
  PlaceTradeRequest,
  PlaceTradeResponse,
  ActiveTradesResponse,
  TradeHistoryResponse,
  SingleTradeResponse,
} from '@/types/trade';

export const tradeService = {
  async getConfig(): Promise<TradingConfigResponse> {
    const { data } = await apiClient.get<TradingConfigResponse>('/trade/config');
    return data;
  },

  async getPairs(): Promise<TradingPairsResponse> {
    const { data } = await apiClient.get<TradingPairsResponse>('/trade/pairs');
    return data;
  },

  async placeTrade(payload: PlaceTradeRequest): Promise<PlaceTradeResponse> {
    const { data } = await apiClient.post<PlaceTradeResponse>('/trade/place', payload);
    return data;
  },

  async getActive(): Promise<ActiveTradesResponse> {
    const { data } = await apiClient.get<ActiveTradesResponse>('/trade/active');
    return data;
  },

  async getHistory(limit = 20, offset = 0): Promise<TradeHistoryResponse> {
    const { data } = await apiClient.get<TradeHistoryResponse>('/trade/history', {
      params: { limit, offset },
    });
    return data;
  },

  async getOne(id: string): Promise<SingleTradeResponse> {
    const { data } = await apiClient.get<SingleTradeResponse>(`/trade/${id}`);
    return data;
  },
};