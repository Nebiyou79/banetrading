// services/providers/coincap.js
// ── COINCAP PROVIDER ──

const { TIER_1, BY_GECKO_ID } = require('../../config/coins');

const COINCAP_BASE = 'https://api.coincap.io/v2';
const FETCH_TIMEOUT_MS = 4000;

// ── CoinCap ID overrides (CoinCap ids that differ from CoinGecko ids) ──
const ID_OVERRIDES = {
  'binance-coin': 'binancecoin',
  'polygon':      'polygon-pos',
};

function resolveCoinCapId(coincapId) {
  return ID_OVERRIDES[coincapId] || coincapId;
}

async function fetchMarkets() {
  const url = `${COINCAP_BASE}/assets?limit=200`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CoinCap ${res.status}`);
    const json = await res.json();
    const data = json.data || [];

    // ── Build symbol lookup from CoinCap response ──
    const bySymbol = {};
    for (const asset of data) {
      const geckoId = resolveCoinCapId(asset.id);
      const meta = BY_GECKO_ID[geckoId];
      if (meta) {
        bySymbol[meta.symbol] = asset;
      }
    }

    return TIER_1
      .filter(meta => bySymbol[meta.symbol])
      .map(meta => {
        const asset = bySymbol[meta.symbol];
        return {
          symbol:      meta.symbol,
          name:        meta.name,
          iconUrl:     null,
          price:       parseFloat(asset.priceUsd) || null,
          change24h:   parseFloat(asset.changePercent24Hr) || null,
          high24h:     null,
          low24h:      null,
          volume24h:   parseFloat(asset.volumeUsd24Hr) || null,
          marketCap:   parseFloat(asset.marketCapUsd) || null,
          sparkline7d: [],
          source:      'coincap',
        };
      });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchMarkets };