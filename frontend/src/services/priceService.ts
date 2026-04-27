// services/priceService.ts
import api from './apiClient';
import type { CoinPrice, Candle } from '@/types';

const priceService = {
  async getPrices(): Promise<CoinPrice[]> {
    const res = await api.get<CoinPrice[]>('/prices');
    return res.data;
  },

  async getHistoricalPrices(
    coinId: string,
    interval: '1h' | '4h' | '1d' | '1w' = '1h',
    limit: number = 100
  ): Promise<Candle[]> {
    const res = await api.get<Candle[]>(`/prices/${coinId}/history`, {
      params: { interval, limit },
    });
    return res.data;
  },

  // Lightweight ticker — returns minimal price data for the navbar strip
  async getTicker(): Promise<Pick<CoinPrice, 'id' | 'symbol' | 'price' | 'change24h'>[]> {
    const prices = await priceService.getPrices();
    return prices.slice(0, 10).map(({ id, symbol, price, change24h }) => ({
      id,
      symbol,
      price,
      change24h,
    }));
  },
};

export default priceService;
