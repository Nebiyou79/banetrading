// services/providers/coinpaprika.js
// ── COINPAPRIKA PROVIDER ──

const { TIER_1 } = require('../../config/coins');

const COINPAPRIKA_BASE = 'https://api.coinpaprika.com/v1';
const FETCH_TIMEOUT_MS = 4000;

async function fetchMarkets() {
  const url = `${COINPAPRIKA_BASE}/tickers?limit=200`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Coinpaprika ${res.status}`);
    const data = await res.json();

    // ── Build symbol lookup ──
    const bySymbol = {};
    for (const ticker of data) {
      bySymbol[ticker.symbol.toUpperCase()] = ticker;
    }

    return TIER_1.map(meta => {
      const ticker = bySymbol[meta.symbol];
      if (!ticker) {
        return {
          symbol:      meta.symbol,
          name:        meta.name,
          iconUrl:     null,
          price:       null,
          change24h:   null,
          high24h:     null,
          low24h:      null,
          volume24h:   null,
          marketCap:   null,
          sparkline7d: [],
          source:      'coinpaprika',
        };
      }
      const q = ticker.quotes?.USD || {};
      return {
        symbol:      meta.symbol,
        name:        ticker.name || meta.name,
        iconUrl:     null,
        price:       q.price || null,
        change24h:   q.percent_change_24h || null,
        high24h:     q.ath_price || null,       // best approximation; Coinpaprika doesn't expose 24h high directly
        low24h:      null,
        volume24h:   q.volume_24h || null,
        marketCap:   q.market_cap || null,
        sparkline7d: [],
        source:      'coinpaprika',
      };
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchMarkets };