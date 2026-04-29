// services/providers/coingecko.js
// ── COINGECKO PROVIDER ──

const { TIER_1 } = require('../../config/coins');

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const FETCH_TIMEOUT_MS = 4000;

async function fetchMarkets() {
  const ids = TIER_1.map(c => c.id).join(',');
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    return data.map(c => ({
      symbol:        c.symbol.toUpperCase(),
      name:          c.name,
      iconUrl:       c.image,
      price:         c.current_price,
      change24h:     c.price_change_percentage_24h,
      high24h:       c.high_24h,
      low24h:        c.low_24h,
      volume24h:     c.total_volume,
      marketCap:     c.market_cap,
      sparkline7d:   c.sparkline_in_7d?.price ?? [],
      source:        'coingecko',
    }));
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchMarkets };