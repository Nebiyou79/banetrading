// constants/assetClasses.ts
// ── FRONTEND ASSET CLASS METADATA ──
// Mirrors backend config/forex.js and config/metals.js so the client
// can detect asset class without an API call.

interface AssetMeta {
  symbol: string;
  display: string;
  decimals: number;
  name: string;
  class: 'forex' | 'metals';
}

const FOREX_META: AssetMeta[] = [
  { symbol: 'EURUSD', display: 'EUR/USD', decimals: 4, name: 'Euro / US Dollar', class: 'forex' },
  { symbol: 'GBPUSD', display: 'GBP/USD', decimals: 4, name: 'British Pound / US Dollar', class: 'forex' },
  { symbol: 'USDJPY', display: 'USD/JPY', decimals: 3, name: 'US Dollar / Japanese Yen', class: 'forex' },
  { symbol: 'USDCHF', display: 'USD/CHF', decimals: 4, name: 'US Dollar / Swiss Franc', class: 'forex' },
  { symbol: 'AUDUSD', display: 'AUD/USD', decimals: 4, name: 'Australian Dollar / US Dollar', class: 'forex' },
];

const METALS_META: AssetMeta[] = [
  { symbol: 'XAUUSD', display: 'XAU/USD', decimals: 2, name: 'Gold / US Dollar', class: 'metals' },
  { symbol: 'XAGUSD', display: 'XAG/USD', decimals: 3, name: 'Silver / US Dollar', class: 'metals' },
];

export const FX_BY_SYMBOL: Record<string, AssetMeta> = Object.fromEntries(
  [...FOREX_META, ...METALS_META].map(m => [m.symbol, m]),
);

export const TIER_1_SYMBOLS = new Set([
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE',
  'TRX', 'MATIC', 'DOT', 'LTC', 'AVAX', 'LINK', 'BCH',
]);

export function getAssetClass(symbol: string): 'crypto' | 'forex' | 'metals' {
  const upper = symbol.toUpperCase();
  if (TIER_1_SYMBOLS.has(upper)) return 'crypto';
  const meta = FX_BY_SYMBOL[upper];
  if (meta) return meta.class;
  return 'crypto'; // fallback
}

export function getAssetMeta(symbol: string): AssetMeta | null {
  return FX_BY_SYMBOL[symbol.toUpperCase()] || null;
}