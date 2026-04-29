// types/markets.ts
// ── MARKETS MODULE TYPES (EXTENDED) ──

export interface MarketRow {
  symbol: string;
  name: string;
  iconUrl: string | null;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  marketCap: number | null;
  sparkline7d: number[];
  source: string;
}

// ── Extended row with asset class ──
export type AssetClass = 'crypto' | 'forex' | 'metals';

export interface MarketRowExtended extends MarketRow {
  class: AssetClass;
  display?: string;
  decimals?: number;
}

export interface ForexRow {
  symbol: string;
  display: string;
  name: string;
  class: 'forex' | 'metals';
  decimals: number;
  price: number | null;
  change24h: number | null;
  high24h: number | null;
  low24h: number | null;
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