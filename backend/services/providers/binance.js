// services/providers/binance.js
// ── BINANCE PROVIDER ──

const { BY_BINANCE } = require('../../config/coins');

const BINANCE_BASE = 'https://api.binance.com/api/v3';
const FETCH_TIMEOUT_MS = 4000;

async function fetchMarkets() {
  const url = `${BINANCE_BASE}/ticker/24hr`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Binance ${res.status}`);
    const data = await res.json();

    return data
      .filter(ticker => BY_BINANCE[ticker.symbol])
      .map(ticker => {
        const meta = BY_BINANCE[ticker.symbol];
        return {
          symbol:      meta.symbol,
          name:        meta.name,
          iconUrl:     null,
          price:       parseFloat(ticker.lastPrice) || null,
          change24h:   parseFloat(ticker.priceChangePercent) || null,
          high24h:     parseFloat(ticker.highPrice) || null,
          low24h:      parseFloat(ticker.lowPrice) || null,
          volume24h:   parseFloat(ticker.quoteVolume) || null,
          marketCap:   null,
          sparkline7d: [],
          source:      'binance',
        };
      });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchMarkets };