// services/marketsService.ts
// ── MARKETS API SERVICE (EXTENDED) ──

import { apiClient } from './apiClient';
import type {
  MarketsListResponse,
  ForexRow,
  MarketRowExtended,
  OhlcResponse,
  Timeframe,
} from '@/types/markets';

export const marketsService = {
  // ── Crypto (existing) ──
  async getMarketsList(): Promise<MarketsListResponse> {
    const { data } = await apiClient.get<MarketsListResponse>('/markets/list');
    return data;
  },

  // ── Forex ──
  async getForex(): Promise<{ rows: ForexRow[]; source: string; stale: boolean }> {
    const { data } = await apiClient.get<{ rows: ForexRow[]; source: string; stale: boolean }>('/markets/forex');
    return data;
  },

  // ── Metals ──
  async getMetals(): Promise<{ rows: ForexRow[]; source: string; stale: boolean }> {
    const { data } = await apiClient.get<{ rows: ForexRow[]; source: string; stale: boolean }>('/markets/metals');
    return data;
  },

  // ── All unified ──
  async getAll(): Promise<{ rows: MarketRowExtended[]; source: string; stale: boolean }> {
    const { data } = await apiClient.get<{ rows: MarketRowExtended[]; source: string; stale: boolean }>('/markets/all');
    return data;
  },

  // ── Single coin / pair ──
  async getCoin(symbol: string): Promise<MarketsListResponse & { row?: MarketRowExtended }> {
    const { data } = await apiClient.get<MarketsListResponse & { row?: MarketRowExtended }>(
      `/markets/${encodeURIComponent(symbol)}`,
    );
    return data;
  },

  // ── OHLC candles (crypto + FX/metals) ──
  async getOhlc(
    symbol: string,
    interval: Timeframe = '1h',
    limit: number = 500,
  ): Promise<OhlcResponse> {
    const { data } = await apiClient.get<OhlcResponse>(
      `/markets/${encodeURIComponent(symbol)}/ohlc`,
      { params: { interval, limit } },
    );
    return data;
  },
};