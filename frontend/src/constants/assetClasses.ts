// constants/assetClasses.ts
// ── FRONTEND MIRROR OF BACKEND FOREX/METALS CONFIG ──
// Used to detect asset class client-side without an API call.

export const FX_PAIRS = [
  { symbol: 'EURUSD', display: 'EUR/USD', base: 'EUR', quote: 'USD', decimals: 4, name: 'Euro / US Dollar',              color: '#3B82F6' },
  { symbol: 'GBPUSD', display: 'GBP/USD', base: 'GBP', quote: 'USD', decimals: 4, name: 'British Pound / US Dollar',    color: '#8B5CF6' },
  { symbol: 'USDJPY', display: 'USD/JPY', base: 'USD', quote: 'JPY', decimals: 3, name: 'US Dollar / Japanese Yen',     color: '#EF4444' },
  { symbol: 'USDCHF', display: 'USD/CHF', base: 'USD', quote: 'CHF', decimals: 4, name: 'US Dollar / Swiss Franc',      color: '#F97316' },
  { symbol: 'AUDUSD', display: 'AUD/USD', base: 'AUD', quote: 'USD', decimals: 4, name: 'Australian Dollar / US Dollar',color: '#10B981' },
] as const;

export const METAL_PAIRS = [
  { symbol: 'XAUUSD', display: 'XAU/USD', base: 'XAU', quote: 'USD', decimals: 2, name: 'Gold / US Dollar',   color: '#FBBF24' },
  { symbol: 'XAGUSD', display: 'XAG/USD', base: 'XAG', quote: 'USD', decimals: 3, name: 'Silver / US Dollar', color: '#9CA3AF' },
] as const;

export const FX_BY_SYMBOL  = Object.fromEntries(FX_PAIRS.map(p    => [p.symbol, p]));
export const METAL_BY_SYMBOL = Object.fromEntries(METAL_PAIRS.map(p => [p.symbol, p]));

export const TIER_1_SYMBOLS = new Set([
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE',
  'TRX', 'MATIC', 'DOT', 'LTC', 'AVAX', 'LINK', 'BCH',
]);

export type AssetClass = 'crypto' | 'forex' | 'metals';

export function getAssetClass(symbol: string): AssetClass {
  const s = symbol.toUpperCase();
  if (FX_BY_SYMBOL[s])    return 'forex';
  if (METAL_BY_SYMBOL[s]) return 'metals';
  return 'crypto';
}