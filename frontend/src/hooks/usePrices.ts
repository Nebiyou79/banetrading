// hooks/usePrices.ts
// ── PRICES HOOK (UPDATED — REDIRECTS TO NEW SYSTEM) ──
// DEPRECATED: Use useMarketTicker or useMarketStore instead.
// Kept for backward compatibility.

import { useMemo } from 'react';
import { useMarketStore } from '@/stores/market.store';
import { useMarkets } from './useMarkets';
import type { OhlcCandle, Timeframe } from '@/types/markets';

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Get live prices from the Zustand store.
 * WebSocket updates flow here automatically.
 */
export const usePrices = (pollInterval: number = 30000) => {
  // Get markets list for metadata
  const { rows, isLoading, error, refetch } = useMarkets();

  // Get live WS prices
  const wsPrices = useMarketStore((s) => s.prices);
  const wsTickers = useMarketStore((s) => s.tickers);

  // Merge market metadata with live prices
  const prices = useMemo<CoinPrice[]>(() => {
    if (Object.keys(wsTickers).length > 0) {
      return Object.values(wsTickers).map((ticker) => ({
        id: ticker.symbol,
        symbol: ticker.symbol,
        name: ticker.symbol.replace('USDT', ''),
        price: ticker.price,
        change24h: ticker.change24h ?? 0,
      }));
    }

    // Fall back to markets list data
    return rows.map((row) => ({
      id: row.symbol,
      symbol: row.symbol,
      name: row.name,
      price: row.price ?? 0,
      change24h: row.change24h ?? 0,
    }));
  }, [wsTickers, rows]);

  return {
    prices,
    loading: isLoading && Object.keys(wsTickers).length === 0,
    error,
    refetch,
  };
};

/**
 * Get ticker data (compact price list).
 */
export const useTicker = () => {
  const wsTickers = useMarketStore((s) => s.tickers);
  const { rows } = useMarkets();

  const ticker = useMemo(() => {
    if (Object.keys(wsTickers).length > 0) {
      return Object.values(wsTickers).map((ticker) => ({
        id: ticker.symbol,
        symbol: ticker.symbol,
        price: ticker.price,
        change24h: ticker.change24h ?? 0,
      }));
    }

    return rows.map((row) => ({
      id: row.symbol,
      symbol: row.symbol,
      price: row.price ?? 0,
      change24h: row.change24h ?? 0,
    }));
  }, [wsTickers, rows]);

  return {
    ticker,
    loading: Object.keys(wsTickers).length === 0,
  };
};

/**
 * Get historical/candlestick data.
 */
export const useHistoricalPrices = (
  coinId: string,
  interval: '1h' | '4h' | '1d' | '1w' = '1h',
) => {
  const { candles, isLoading, error, refetch } = useOhlc(coinId, interval, 500);

  return {
    candles,
    loading: isLoading,
    error,
    refetch,
  };
};

// Import for useHistoricalPrices
import { useOhlc } from './useOhlc';