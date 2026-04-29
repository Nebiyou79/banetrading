// services/forexAggregator.js
// ── FOREX AGGREGATOR WITH CASCADE FALLBACK ──

const cache = require('./priceCache');
const ehost = require('./providers/fxExchangerateHost');
const frank = require('./providers/fxFrankfurter');
const twelve = require('./providers/fxTwelveData');
const { FOREX_PAIRS } = require('../config/forex');
const { METAL_PAIRS } = require('../config/metals');

const PROVIDERS = [
  { name: 'exchangerate.host', fn: ehost.fetchAll,       hasMetals: true },
  { name: 'frankfurter',       fn: frank.fetchForex,      hasMetals: false },
  { name: 'twelvedata',        fn: twelve.fetchAll,       hasMetals: true },
];

const FX_LIST_KEY = 'forex:list';
const FX_TTL_MS = 60 * 1000;
const STALE_OK_MS = 10 * 60 * 1000;

// ── Main entry point ──
async function getForexAndMetals() {
  // 1. Fresh cache hit?
  const fresh = cache.get(FX_LIST_KEY, FX_TTL_MS);
  if (fresh) return { rows: fresh.value, source: fresh.source, stale: false };

  // 2. Cascade providers
  for (const p of PROVIDERS) {
    try {
      const rows = await p.fn();
      if (rows && rows.length > 0) {
        const merged = mergeWithMetadata(rows);
        cache.set(FX_LIST_KEY, merged, p.name);
        return { rows: merged, source: p.name, stale: false };
      }
    } catch (err) {
      console.warn(`[forexAggregator] ${p.name} failed: ${err.message}`);
    }
  }

  // 3. All failed — serve stale if available
  const stale = cache.get(FX_LIST_KEY, STALE_OK_MS);
  if (stale) return { rows: stale.value, source: stale.source, stale: true };

  // 4. Total failure
  throw new Error('All forex providers failed and no cache available');
}

// ── Merge provider rows with metadata ──
function mergeWithMetadata(rows) {
  const all = [...FOREX_PAIRS, ...METAL_PAIRS];
  return all.map(meta => {
    const row = rows.find(r => r.symbol === meta.symbol) || {};
    return {
      symbol:    meta.symbol,
      display:   meta.display,
      name:      meta.name,
      class:     ['XAUUSD', 'XAGUSD'].includes(meta.symbol) ? 'metals' : 'forex',
      decimals:  meta.decimals,
      color:     meta.color,
      price:     row.price     ?? null,
      change24h: row.change24h ?? null,
      high24h:   row.high24h   ?? null,
      low24h:    row.low24h    ?? null,
      source:    row.source    ?? 'unknown',
    };
  });
}

module.exports = { getForexAndMetals };