// config/metals.js
// ── METAL PAIR METADATA ──

const METAL_PAIRS = [
  { symbol: 'XAUUSD', display: 'XAU/USD', base: 'XAU', quote: 'USD', decimals: 2, pip: 0.01,  name: 'Gold / US Dollar',   color: '#FBBF24' },
  { symbol: 'XAGUSD', display: 'XAG/USD', base: 'XAG', quote: 'USD', decimals: 3, pip: 0.001, name: 'Silver / US Dollar', color: '#9CA3AF' },
];

const METAL_BY_SYMBOL = Object.fromEntries(METAL_PAIRS.map(p => [p.symbol, p]));

module.exports = { METAL_PAIRS, METAL_BY_SYMBOL };