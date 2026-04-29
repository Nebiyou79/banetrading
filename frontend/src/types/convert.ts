// types/convert.ts
// ── ASSET CONVERSION TYPES ──

export type Currency = 'USDT' | 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'XRP';

export interface ConversionQuote {
  marketRate: number;
  effectiveRate: number;
  toAmount: number;
  feeBps: number;
  expiresAt: string;
}

export interface ConversionRecord {
  _id: string;
  userId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: number;
  toAmount: number;
  rate: number;
  marketRate: number;
  feeBps: number;
  status: 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UserBalances {
  balances: Record<Currency, number>;
}

export interface ConversionConfig {
  _id: string;
  feeBps: number;
  minConvertUsd: number;
  enabledPairs: string[];
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}