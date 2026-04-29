// config/forex.js
// ── FOREX PAIR METADATA ──

const FOREX_PAIRS = [
  { symbol: 'EURUSD', display: 'EUR/USD', base: 'EUR', quote: 'USD', decimals: 4, pip: 0.0001, name: 'Euro / US Dollar',        color: '#3B82F6' },
  { symbol: 'GBPUSD', display: 'GBP/USD', base: 'GBP', quote: 'USD', decimals: 4, pip: 0.0001, name: 'British Pound / US Dollar', color: '#8B5CF6' },
  { symbol: 'USDJPY', display: 'USD/JPY', base: 'USD', quote: 'JPY', decimals: 3, pip: 0.01,   name: 'US Dollar / Japanese Yen',   color: '#EF4444' },
  { symbol: 'USDCHF', display: 'USD/CHF', base: 'USD', quote: 'CHF', decimals: 4, pip: 0.0001, name: 'US Dollar / Swiss Franc',    color: '#F97316' },
  { symbol: 'AUDUSD', display: 'AUD/USD', base: 'AUD', quote: 'USD', decimals: 4, pip: 0.0001, name: 'Australian Dollar / US Dollar', color: '#10B981' },
];

const FX_BY_SYMBOL = Object.fromEntries(FOREX_PAIRS.map(p => [p.symbol, p]));

module.exports = { FOREX_PAIRS, FX_BY_SYMBOL };