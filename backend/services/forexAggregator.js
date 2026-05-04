// services/forexAggregator.js
// ── FOREX + METALS AGGREGATOR — always returns data ──

const cache = require('./priceCache');
const { FOREX_PAIRS } = require('../config/forex');
const { METAL_PAIRS } = require('../config/metals');

const FX_LIST_KEY = 'forex:list';
const FX_TTL_MS   = 120 * 1000;      // 2 min
const STALE_OK_MS = 30 * 60 * 1000;  // 30 min stale OK

// Realistic mid-market prices (approximate)
const SYNTHETIC_PRICES = {
  EURUSD: 1.0850, GBPUSD: 1.2700, USDJPY: 149.50,
  USDCHF: 0.9000, AUDUSD: 0.6500,
  XAUUSD: 3300.00, XAGUSD: 30.00,
};

// ── Provider implementations ──

async function fetchExchangeRateApi() {
  // open.er-api.com — free, no key, reliable
  const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 6000);
  if (!res.ok) throw new Error(`er-api HTTP ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success') throw new Error('er-api: bad response');

  const rates = data.rates || {};
  const rows = [];

  // EURUSD, GBPUSD, AUDUSD — invert from USD base
  for (const [fxSym, base] of [['EURUSD','EUR'],['GBPUSD','GBP'],['AUDUSD','AUD']]) {
    const r = rates[base];
    if (r && r > 0) rows.push({ symbol: fxSym, price: +(1 / r).toFixed(5), change24h: null, high24h: null, low24h: null, source: 'er-api' });
  }
  // USDJPY, USDCHF — direct from USD
  for (const [fxSym, quote] of [['USDJPY','JPY'],['USDCHF','CHF']]) {
    const r = rates[quote];
    if (r && r > 0) rows.push({ symbol: fxSym, price: +r.toFixed(4), change24h: null, high24h: null, low24h: null, source: 'er-api' });
  }

  // Metals: XAUUSD, XAGUSD via XAU/XAG rates if available
  if (rates.XAU && rates.XAU > 0) {
    rows.push({ symbol: 'XAUUSD', price: +(1 / rates.XAU).toFixed(2), change24h: null, high24h: null, low24h: null, source: 'er-api' });
  }
  if (rates.XAG && rates.XAG > 0) {
    rows.push({ symbol: 'XAGUSD', price: +(1 / rates.XAG).toFixed(3), change24h: null, high24h: null, low24h: null, source: 'er-api' });
  }

  return rows;
}

async function fetchFrankfurter() {
  // api.frankfurter.app — free, ECB data, reliable
  const res = await fetchWithTimeout('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,AUD', 6000);
  if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
  const data = await res.json();
  const rates = data.rates || {};

  return [
    rates.EUR && { symbol: 'EURUSD', price: +(1 / rates.EUR).toFixed(5), change24h: null, high24h: null, low24h: null, source: 'frankfurter' },
    rates.GBP && { symbol: 'GBPUSD', price: +(1 / rates.GBP).toFixed(5), change24h: null, high24h: null, low24h: null, source: 'frankfurter' },
    rates.JPY && { symbol: 'USDJPY', price: +rates.JPY.toFixed(3), change24h: null, high24h: null, low24h: null, source: 'frankfurter' },
    rates.CHF && { symbol: 'USDCHF', price: +rates.CHF.toFixed(5), change24h: null, high24h: null, low24h: null, source: 'frankfurter' },
    rates.AUD && { symbol: 'AUDUSD', price: +(1 / rates.AUD).toFixed(5), change24h: null, high24h: null, low24h: null, source: 'frankfurter' },
  ].filter(Boolean);
}

async function fetchTwelveData() {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) return [];

  const symbols = 'EUR/USD,GBP/USD,USD/JPY,USD/CHF,AUD/USD,XAU/USD,XAG/USD';
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbols)}&apikey=${key}`;
  const res = await fetchWithTimeout(url, 8000);
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  const data = await res.json();

  const mapping = {
    'EUR/USD': 'EURUSD', 'GBP/USD': 'GBPUSD', 'USD/JPY': 'USDJPY',
    'USD/CHF': 'USDCHF', 'AUD/USD': 'AUDUSD', 'XAU/USD': 'XAUUSD', 'XAG/USD': 'XAGUSD',
  };
  const rows = [];
  for (const [td, our] of Object.entries(mapping)) {
    const entry = data[td];
    const price = entry?.price ? parseFloat(entry.price) : null;
    if (price && price > 0) {
      rows.push({ symbol: our, price, change24h: null, high24h: null, low24h: null, source: 'twelvedata' });
    }
  }
  return rows;
}

// ── Helpers ──

function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

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

// ── Main export ──

async function getForexAndMetals() {
  // 1. Fresh cache
  const fresh = cache.get(FX_LIST_KEY, FX_TTL_MS);
  if (fresh) return { rows: fresh.value, source: fresh.source, stale: false };

  // 2. Try providers in order
  const providers = [
    { name: 'exchangerate-api', fn: fetchExchangeRateApi },
    { name: 'frankfurter',      fn: fetchFrankfurter     },
    { name: 'twelvedata',       fn: fetchTwelveData      },
  ];

  for (const p of providers) {
    try {
      const rows = await p.fn();
      if (rows && rows.length >= 3) {  // Need at least 3 pairs to be useful
        const merged = mergeWithMetadata(rows);
        cache.set(FX_LIST_KEY, merged, p.name);
        return { rows: merged, source: p.name, stale: false };
      }
    } catch (err) {
      if (!err.message?.includes('aborted')) {
        console.warn(`[forexAggregator] ${p.name} failed: ${err.message}`);
      }
    }
  }

  // 3. Stale cache
  const stale = cache.get(FX_LIST_KEY, STALE_OK_MS);
  if (stale) {
    console.warn('[forexAggregator] All providers failed — serving stale cache');
    return { rows: stale.value, source: stale.source, stale: true };
  }

  // 4. Synthetic fallback (always works)
  console.warn('[forexAggregator] All providers failed + no cache — using synthetic prices');
  const synthetic = buildSyntheticRows();
  cache.set(FX_LIST_KEY, synthetic, 'synthetic');
  return { rows: synthetic, source: 'synthetic', stale: true };
}

module.exports = { getForexAndMetals };