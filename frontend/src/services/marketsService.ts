// services/marketsService.ts
// ── MARKETS API SERVICE ──

import { apiClient } from './apiClient';
import type {
  MarketsListResponse,
  ForexRow,
  MarketRowExtended,
  OhlcResponse,
  Timeframe,
  NormalizedTicker,
  NormalizedCandle,
  NormalizedMarket,
  ApiResponse,
  AssetClass,
} from '@/types/markets';

export const marketsService = {
  // ── Crypto markets list ──
  async getMarketsList(): Promise<MarketsListResponse> {
    // Try new unified endpoint first
    try {
      const { data } = await apiClient.get<any>('/market/markets');
      if (data?.success && data?.data?.length > 0) {
        return {
          rows:   data.data,
          source: data.provider || 'market-service',
          stale:  false,
        } as MarketsListResponse;
      }
    } catch { /* fall through */ }
    // Fallback to legacy /markets/list
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

  // ── OHLC candles (legacy endpoint) ──
  async getOhlc(
    symbol: string,
    interval: Timeframe = '1h',
    limit: number = 300,
  ): Promise<OhlcResponse> {
    const { data } = await apiClient.get<OhlcResponse>(
      `/markets/${encodeURIComponent(symbol)}/ohlc`,
      { params: { interval, limit } },
    );
    return data;
  },

  // ── NEW: Chart candles via /api/chart (TradingView-compatible, synthetic fallback) ──
  async getChartCandles(
    symbol: string,
    interval: string = '1h',
    assetClass: AssetClass = 'crypto',
    limit: number = 300,
  ): Promise<NormalizedCandle[]> {
    const { data } = await apiClient.get<ApiResponse<NormalizedCandle[]>>(
      '/chart',
      {
        params: {
          symbol,
          interval,
          limit,
        },
      },
    );

    if (!data.success) throw new Error(data.error || 'Failed to fetch candles');
    if (!data.data || data.data.length === 0) throw new Error('No candle data');
    return data.data;
  },

  // ── Ticker from market aggregation system ──
  async getTicker(
    symbol: string,
    assetClass: AssetClass = 'crypto',
  ): Promise<NormalizedTicker> {
    const endpoint = assetClass === 'forex'
      ? '/market/forex'
      : assetClass === 'metals'
        ? '/market/metals'
        : '/market/crypto';

    const { data } = await apiClient.get<ApiResponse<NormalizedTicker>>(
      endpoint,
      { params: { symbol, type: 'ticker' } },
    );

    if (!data.success) throw new Error(data.error || 'Failed to fetch ticker');
    return data.data;
  },

  // ── Aggregated market list from new system ──
  async getAggregatedMarkets(): Promise<NormalizedMarket[]> {
    const { data } = await apiClient.get<ApiResponse<NormalizedMarket[]>>('/market/markets');

    if (!data.success) throw new Error(data.error || 'Failed to fetch markets');
    return data.data;
  },

  // ── Search assets ──
  async searchAssets(query: string): Promise<NormalizedMarket[]> {
    const { data } = await apiClient.get<ApiResponse<NormalizedMarket[]>>('/market/search', {
      params: { q: query },
    });

    if (!data.success) throw new Error(data.error || 'Search failed');
    return data.data;
  },

  // ── Provider health ──
  async getMarketHealth(): Promise<any[]> {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/market/health');

    if (!data.success) throw new Error(data.error || 'Health check failed');
    return data.data;
  },
};