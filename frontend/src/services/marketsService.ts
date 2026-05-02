// services/marketsService.ts
// ── MARKETS API SERVICE (EXTENDED WITH NEW MARKET ENDPOINTS) ──

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

  // ── NEW: Market data via internal aggregation API ──

  /**
   * Get ticker from the new market aggregation system.
   * Goes through Redis cache — no 429s.
   */
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

  /**
   * Get OHLC candles from the new chart API.
   * TradingView-compatible format.
   */
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
          class: assetClass,
          limit,
        },
      },
    );

    if (!data.success) throw new Error(data.error || 'Failed to fetch candles');
    return data.data;
  },

  /**
   * Get merged market list from the new aggregation system.
   * Binance prices + CoinGecko metadata/images.
   */
  async getAggregatedMarkets(): Promise<NormalizedMarket[]> {
    const { data } = await apiClient.get<ApiResponse<NormalizedMarket[]>>('/market/markets');

    if (!data.success) throw new Error(data.error || 'Failed to fetch markets');
    return data.data;
  },

  /**
   * Search assets across all classes.
   */
  async searchAssets(query: string): Promise<NormalizedMarket[]> {
    const { data } = await apiClient.get<ApiResponse<NormalizedMarket[]>>('/market/search', {
      params: { q: query },
    });

    if (!data.success) throw new Error(data.error || 'Search failed');
    return data.data;
  },

  /**
   * Get provider health status.
   */
  async getMarketHealth(): Promise<any[]> {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/market/health');

    if (!data.success) throw new Error(data.error || 'Health check failed');
    return data.data;
  },
};