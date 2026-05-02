// lib/market-api.ts
// ── CENTRALIZED MARKET DATA API CLIENT ──
// Every market data fetch goes through this file.
// NEVER call Binance/CoinGecko/TwelveData directly from the browser.

import type {
  NormalizedTicker,
  NormalizedCandle,
  NormalizedMarket,
  ApiResponse,
  AssetClass,
} from '@/types/markets';

const BASE = '/api/market';

/**
 * Fetch a single ticker via internal API.
 * Goes through Redis cache (2-5s TTL) — no 429s.
 */
export async function fetchTicker(
  symbol: string,
  assetClass: AssetClass = 'crypto',
  options?: {
    signal?: AbortSignal;
  },
): Promise<NormalizedTicker> {
  const endpoint =
    assetClass === 'forex'
      ? `${BASE}/forex`
      : assetClass === 'metals'
        ? `${BASE}/metals`
        : `${BASE}/crypto`;

  const params = new URLSearchParams({ symbol, type: 'ticker' });
  const res = await fetch(`${endpoint}?${params}`, {
    signal: options?.signal,
  });

  if (!res.ok) throw new Error(`fetchTicker failed: ${res.status}`);
  const json: ApiResponse<NormalizedTicker> = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

/**
 * Fetch OHLC candles via internal /api/chart route.
 * TradingView chart calls THIS, never Binance directly.
 */
export async function fetchCandles(
  symbol: string,
  interval: string,
  assetClass: AssetClass = 'crypto',
  limit: number = 300,
  options?: {
    signal?: AbortSignal;
  },
): Promise<NormalizedCandle[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    class: assetClass,
    limit: String(limit),
  });

  const res = await fetch(`/api/chart?${params}`, {
    signal: options?.signal,
  });

  if (!res.ok) throw new Error(`fetchCandles failed: ${res.status}`);
  const json: ApiResponse<NormalizedCandle[]> = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

/**
 * Fetch merged market list.
 * Binance prices + CoinGecko metadata.
 */
export async function fetchMarkets(
  options?: {
    signal?: AbortSignal;
  },
): Promise<NormalizedMarket[]> {
  const res = await fetch(`${BASE}/markets`, {
    signal: options?.signal,
  });

  if (!res.ok) throw new Error(`fetchMarkets failed: ${res.status}`);
  const json: ApiResponse<NormalizedMarket[]> = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

/**
 * Search assets by query.
 */
export async function searchAssets(
  query: string,
  options?: {
    signal?: AbortSignal;
  },
): Promise<NormalizedMarket[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${BASE}/search?${params}`, {
    signal: options?.signal,
  });

  if (!res.ok) throw new Error(`searchAssets failed: ${res.status}`);
  const json: ApiResponse<NormalizedMarket[]> = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}