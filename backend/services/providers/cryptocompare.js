// services/providers/cryptocompare.js
// ── CRYPTOCOMPARE PROVIDER ──

const { TIER_1 } = require('../../config/coins');

const CRYPTOCOMPARE_BASE = 'https://min-api.cryptocompare.com/data';
const FETCH_TIMEOUT_MS = 4000;

async function fetchMarkets() {
  const symbols = TIER_1.map(c => c.symbol).join(',');
  const url = `${CRYPTOCOMPARE_BASE}/pricemultifull?fsyms=${symbols}&tsyms=USD`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CryptoCompare ${res.status}`);
    const json = await res.json();

    return TIER_1.map(meta => {
      const raw = json.RAW?.[meta.symbol]?.USD;
      if (!raw) {
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
          source:      'cryptocompare',
        };
      }
      return {
        symbol:      meta.symbol,
        name:        meta.name,
        iconUrl:     null,
        price:       raw.PRICE || null,
        change24h:   raw.CHANGEPCT24HOUR || null,
        high24h:     raw.HIGH24HOUR || null,
        low24h:      raw.LOW24HOUR || null,
        volume24h:   raw.VOLUME24HOUR || null,
        marketCap:   raw.MKTCAP || null,
        sparkline7d: [],
        source:      'cryptocompare',
      };
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchMarkets };