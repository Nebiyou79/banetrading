'use client';
// hooks/usePrices.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import priceService from '@/services/priceService';
import type { CoinPrice, Candle } from '@/types';

export const usePrices = (pollInterval = 30000) => {
  const [prices, setPrices] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = useCallback(async () => {
    setError(null);
    try {
      const data = await priceService.getPrices();
      setPrices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchPrices, pollInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrices, pollInterval]);

  return { prices, loading, error, refetch: fetchPrices };
};

export const useTicker = (pollInterval = 30000) => {
  const [ticker, setTicker] = useState<Pick<CoinPrice, 'id' | 'symbol' | 'price' | 'change24h'>[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTicker = useCallback(async () => {
    try {
      const data = await priceService.getTicker();
      setTicker(data);
    } catch {
      // Silently fail on ticker — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTicker();
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchTicker, pollInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTicker, pollInterval]);

  return { ticker, loading };
};

export const useHistoricalPrices = (
  coinId: string,
  interval: '1h' | '4h' | '1d' | '1w' = '1h'
) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandles = useCallback(async () => {
    if (!coinId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await priceService.getHistoricalPrices(coinId, interval);
      setCandles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [coinId, interval]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return { candles, loading, error, refetch: fetchCandles };
};
