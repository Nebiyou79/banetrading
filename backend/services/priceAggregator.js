// services/priceAggregator.js
// ── PRICE AGGREGATOR WITH CASCADE FALLBACK ──
// CoinGecko is rate-limited to ~30 req/min. We cache aggressively
// and try Binance/CoinCap first to conserve CoinGecko quota for OHLC.

const cache = require('./priceCache');
const coingecko = require('./providers/coingecko');
const binance = require('./providers/binance');
const coincap = require('./providers/coincap');
const cryptocompare = require('./providers/cryptocompare');
const coinpaprika = require('./providers/coinpaprika');
const { TIER_1, BY_SYMBOL } = require('../config/coins');

// ── Try Binance/CoinCap FIRST to save CoinGecko quota ──
const PROVIDERS = [
  { name: 'binance',       fn: binance.fetchMarkets,       priority: 1 },
  { name: 'coincap',       fn: coincap.fetchMarkets,       priority: 2 },
  { name: 'cryptocompare', fn: cryptocompare.fetchMarkets, priority: 3 },
  { name: 'coinpaprika',   fn: coinpaprika.fetchMarkets,   priority: 4 },
  { name: 'coingecko',     fn: coingecko.fetchMarkets,     priority: 5 }, // LAST — save for OHLC
];

const LIST_CACHE_KEY = 'markets:list';
const LIST_TTL_MS = 60 * 1000;           // 60s cache (was 30s)
const STALE_OK_MS = 10 * 60 * 1000;      // 10 min stale OK (was 5 min)

// ── Fetch the full tier-1 market list ──
async function getMarketList() {
  // 1. Fresh cache hit?
  const fresh = cache.get(LIST_CACHE_KEY, LIST_TTL_MS);
  if (fresh) return { rows: fresh.value, source: fresh.source, stale: false };

  // 2. Cascade providers (Binance/CoinCap first)
  for (const p of PROVIDERS) {
    try {
      const rows = await p.fn();
      if (rows && rows.length > 0) {
        const normalized = mergeWithMetadata(rows);
        cache.set(LIST_CACHE_KEY, normalized, p.name);
        return { rows: normalized, source: p.name, stale: false };
      }
    } catch (err) {
      // Silently skip — only log if it's not a network issue
      if (!err.message?.includes('aborted') && !err.message?.includes('fetch failed')) {
        console.warn(`[priceAggregator] ${p.name} failed: ${err.message}`);
      }
    }
  }

  // 3. All failed — serve stale if available
  const stale = cache.get(LIST_CACHE_KEY, STALE_OK_MS);
  if (stale) return { rows: stale.value, source: stale.source, stale: true };

  // 4. Total failure
  throw new Error('All price providers failed and no cache available');
}

// ── Merge provider rows with Tier-1 metadata ──
function mergeWithMetadata(rows) {
  return TIER_1.map(meta => {
    const row = rows.find(r => r.symbol === meta.symbol) || {};
    return {
      symbol:      meta.symbol,
      name:        row.name      || meta.name,
      iconUrl:     row.iconUrl   || null,
      price:       row.price     ?? null,
      change24h:   row.change24h ?? null,
      high24h:     row.high24h   ?? null,
      low24h:      row.low24h    ?? null,
      volume24h:   row.volume24h ?? null,
      marketCap:   row.marketCap ?? null,
      sparkline7d: row.sparkline7d || [],
      source:      row.source    || 'unknown',
    };
  });
}

module.exports = { getMarketList };