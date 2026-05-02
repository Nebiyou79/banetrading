// types/markets.ts
// ── MARKET DATA TYPES (EXTENDED) ──

export interface MarketRow {
  symbol: string;
  name: string;
  iconUrl: string | null;
  color?: string;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  sparkline7d: number[];
  source: string;
}

export interface MarketsListResponse {
  rows: MarketRow[];
  source: string;
  stale: boolean;
}

export interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OhlcResponse {
  candles: OhlcCandle[];
  source: string;
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export type AssetClass = 'crypto' | 'forex' | 'metals';

export interface ForexRow {
  symbol: string;
  display: string;
  name: string;
  class: 'forex' | 'metals';
  decimals: number;
  color: string;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  source: string;
}

export interface MarketRowExtended extends MarketRow {
  class: AssetClass;
  display?: string;
  decimals?: number;
}

// ── NEW: Normalized types from backend ──

export interface NormalizedTicker {
  symbol: string;
  price: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  timestamp: number;
  provider: string;
}

export interface NormalizedCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NormalizedMarket {
  symbol: string;
  name: string;
  image?: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
  timestamp?: number;
}