// services/forexAggregator.js
// ── FOREX AGGREGATOR (FIXED: robust cascade, always returns data) ──
// Issue: when primary providers fail, the aggregator was throwing instead of
// returning synthetic/stale data. Fixed to always return rows.

const cache = require('./priceCache');
const { FOREX_PAIRS } = require('../config/forex');
const { METAL_PAIRS } = require('../config/metals');

const FX_LIST_KEY  = 'forex:list';
const FX_TTL_MS    = 120 * 1000;       // 2 min fresh cache
const STALE_OK_MS  = 30 * 60 * 1000;  // 30 min stale is OK (forex moves slowly)

// Lazy-load providers to avoid startup errors if packages missing
function loadProviders() {
  const providers = [];

  try {
    const ehost = require('./providers/fxExchangerateHost');
    providers.push({ name: 'exchangerate.host', fn: ehost.fetchAll, hasMetals: true });
  } catch (e) { console.warn('[forexAggregator] fxExchangerateHost not available:', e.message); }

  try {
    const frank = require('./providers/fxFrankfurter');
    providers.push({ name: 'frankfurter', fn: frank.fetchForex, hasMetals: false });
  } catch (e) { console.warn('[forexAggregator] fxFrankfurter not available:', e.message); }

  try {
    const twelve = require('./providers/fxTwelveData');
    providers.push({ name: 'twelvedata', fn: twelve.fetchAll, hasMetals: true });
  } catch (e) { /* optional — needs API key */ }

  return providers;
}

let _providers = null;
function getProviders() {
  if (!_providers) _providers = loadProviders();
  return _providers;
}

async function getForexAndMetals() {
  // 1. Fresh cache
  const fresh = cache.get(FX_LIST_KEY, FX_TTL_MS);
  if (fresh) return { rows: fresh.value, source: fresh.source, stale: false };

  const providers = getProviders();

  // 2. Try each provider
  for (const p of providers) {
    try {
      const rows = await p.fn();
      if (rows && rows.length > 0) {
        const merged = mergeWithMetadata(rows);
        cache.set(FX_LIST_KEY, merged, p.name);
        return { rows: merged, source: p.name, stale: false };
      }
    } catch (err) {
      if (!err.message?.includes('aborted') && !err.message?.includes('fetch failed')) {
        console.warn(`[forexAggregator] ${p.name} failed: ${err.message}`);
      }
    }
  }

  // 3. Stale cache (up to 30 min)
  const stale = cache.get(FX_LIST_KEY, STALE_OK_MS);
  if (stale) {
    console.warn('[forexAggregator] All providers failed — serving stale cache');
    return { rows: stale.value, source: stale.source, stale: true };
  }

  // 4. FIXED: Synthetic fallback — generate plausible placeholder prices
  // so forex/metals pages always show something instead of blank.
  console.warn('[forexAggregator] All providers failed + no cache — using synthetic prices');
  const synthetic = buildSyntheticRows();
  cache.set(FX_LIST_KEY, synthetic, 'synthetic');
  return { rows: synthetic, source: 'synthetic', stale: true };
}

/** Merge provider rows with pair metadata */
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

/** Synthetic prices — approximate real-world values so UI is not blank */
const SYNTHETIC_PRICES = {
  EURUSD: 1.0850, GBPUSD: 1.2700, USDJPY: 149.50,
  USDCHF: 0.9000, AUDUSD: 0.6500,
  XAUUSD: 2320.00, XAGUSD: 27.50,
};

function buildSyntheticRows() {
  const all = [...FOREX_PAIRS, ...METAL_PAIRS];
  return all.map(meta => ({
    symbol:    meta.symbol,
    display:   meta.display,
    name:      meta.name,
    class:     ['XAUUSD', 'XAGUSD'].includes(meta.symbol) ? 'metals' : 'forex',
    decimals:  meta.decimals,
    color:     meta.color,
    price:     SYNTHETIC_PRICES[meta.symbol] ?? null,
    change24h: null,
    high24h:   null,
    low24h:    null,
    source:    'synthetic',
  }));
}

module.exports = { getForexAndMetals };