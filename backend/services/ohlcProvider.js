// services/ohlcProvider.js
// ── OHLC CANDLE PROVIDER — MULTI-SOURCE WITH SMART ROUTING ──
// Priority: Binance (crypto) → CoinCap → CryptoCompare → CoinGecko (rate-limited, last resort)
// FX/Metals: Twelve Data → Alpha Vantage → exchangerate.host timeseries → synthetic

const cache = require('./priceCache');
const { BY_SYMBOL } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

const FETCH_TIMEOUT_MS = 8000;

// ── TTLs per interval ──
const TTL_BY_INTERVAL = {
  '1m':  30 * 1000,
  '5m':  60 * 1000,
  '15m': 2 * 60 * 1000,
  '1h':  5 * 60 * 1000,
  '4h':  15 * 60 * 1000,
  '1d':  60 * 60 * 1000,
  '1w':  4 * 60 * 60 * 1000,
};

const VALID_INTERVALS = Object.keys(TTL_BY_INTERVAL);

// ── CoinGecko rate limiter — 30 req/min = 2s between calls ──
let coingeckoLastCall = 0;
const COINGECKO_MIN_INTERVAL_MS = 2500;

async function rateLimitedCoinGecko(fn) {
  const now = Date.now();
  const wait = Math.max(0, COINGECKO_MIN_INTERVAL_MS - (now - coingeckoLastCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  coingeckoLastCall = Date.now();
  return fn();
}

// ── CoinGecko ID overrides ──
const GECKO_ID_MAP = {
  MATIC: 'matic-network', BNB: 'binancecoin', USDT: 'tether',
  ADA: 'cardano', SOL: 'solana', DOT: 'polkadot', AVAX: 'avalanche-2',
  LINK: 'chainlink', BCH: 'bitcoin-cash', LTC: 'litecoin',
  XRP: 'ripple', DOGE: 'dogecoin', TRX: 'tron',
};

function getGeckoId(symbol) {
  return GECKO_ID_MAP[symbol] || BY_SYMBOL[symbol]?.id || symbol.toLowerCase();
}

// ── CoinCap ID map ──
const COINCAP_ID_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', BNB: 'binance-coin',
  SOL: 'solana', XRP: 'xrp', ADA: 'cardano', DOGE: 'dogecoin',
  TRX: 'tron', MATIC: 'polygon', DOT: 'polkadot', LTC: 'litecoin',
  AVAX: 'avalanche', LINK: 'chainlink', BCH: 'bitcoin-cash',
};

// ── Main router ──
async function getOhlc(symbol, interval = '1h', limit = 500) {
  const sym = symbol.toUpperCase();

  if (!VALID_INTERVALS.includes(interval)) {
    const err = new Error(`Invalid interval. Valid: ${VALID_INTERVALS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (BY_SYMBOL[sym]) return getCryptoOhlc(sym, interval, limit);

  if (FX_BY_SYMBOL[sym] || METAL_BY_SYMBOL[sym]) {
    if (['1m', '5m', '15m'].includes(interval)) {
      const err = new Error('Sub-hourly intervals require a premium data feed for FX/Metals.');
      err.statusCode = 400;
      throw err;
    }
    return getFxOhlc(sym, interval, limit);
  }

  const err = new Error(`Unknown symbol: ${symbol}`);
  err.statusCode = 404;
  throw err;
}

// ── CRYPTO OHLC — Binance first (no rate limit), then CoinCap, CryptoCompare, CoinGecko last ──
async function getCryptoOhlc(symbol, interval, limit) {
  const key = `ohlc:${symbol}:${interval}:${limit}`;
  const ttl = TTL_BY_INTERVAL[interval];

  const fresh = cache.get(key, ttl);
  if (fresh) return { candles: fresh.value, source: fresh.source };

  const meta = BY_SYMBOL[symbol];

  // 1. Binance klines — best source (1200 req/min, no key)
  if (meta?.binanceSymbol && !['1w'].includes(interval)) {
    try {
      const candles = await fetchBinanceKlines(meta.binanceSymbol, interval, limit);
      if (candles?.length > 0) {
        cache.set(key, candles, 'binance');
        return { candles, source: 'binance' };
      }
    } catch (err) {
      if (!err.message?.includes('aborted')) {
        console.warn(`[ohlc] Binance failed ${symbol}/${interval}: ${err.message}`);
      }
    }
  }

  // 2. CoinCap — good free fallback, no key
  const coincapId = COINCAP_ID_MAP[symbol];
  if (coincapId) {
    try {
      const candles = await fetchCoinCapOhlc(coincapId, interval, limit);
      if (candles?.length > 0) {
        cache.set(key, candles, 'coincap');
        return { candles, source: 'coincap' };
      }
    } catch (err) {
      if (!err.message?.includes('aborted')) {
        console.warn(`[ohlc] CoinCap failed ${symbol}/${interval}: ${err.message}`);
      }
    }
  }

  // 3. CryptoCompare — 100k calls/month, no key for basic
  try {
    const candles = await fetchCryptoCompareOhlc(symbol, interval, limit);
    if (candles?.length > 0) {
      cache.set(key, candles, 'cryptocompare');
      return { candles, source: 'cryptocompare' };
    }
  } catch (err) {
    if (!err.message?.includes('aborted')) {
      console.warn(`[ohlc] CryptoCompare failed ${symbol}/${interval}: ${err.message}`);
    }
  }

  // 4. CoinGecko — rate-limited, use last (with rate limiting)
  try {
    const geckoId = getGeckoId(symbol);
    const candles = await rateLimitedCoinGecko(() => fetchCoinGeckoOhlc(geckoId, interval));
    if (candles?.length > 0) {
      cache.set(key, candles, 'coingecko');
      return { candles, source: 'coingecko' };
    }
  } catch (err) {
    if (err.message?.includes('429')) {
      console.warn(`[ohlc] CoinGecko rate-limited for ${symbol}/${interval}`);
    } else {
      console.warn(`[ohlc] CoinGecko failed ${symbol}/${interval}: ${err.message}`);
    }
  }

  // 5. Stale cache (up to 24h)
  const stale = cache.get(key, 24 * 60 * 60 * 1000);
  if (stale) {
    console.warn(`[ohlc] Serving stale cache for ${symbol}/${interval}`);
    return { candles: stale.value, source: `${stale.source}(stale)` };
  }

  // 6. Synthetic fallback (never return empty if we have a price)
  try {
    const synth = await generateCryptoSynthetic(symbol, interval, limit);
    if (synth?.length > 0) {
      cache.set(key, synth, 'synthetic');
      return { candles: synth, source: 'synthetic' };
    }
  } catch { /* ignore */ }

  console.warn(`[ohlc] All providers failed for ${symbol}/${interval}`);
  return { candles: [], source: 'none' };
}

// ── FX / METALS OHLC ──
async function getFxOhlc(symbol, interval, limit) {
  const key = `ohlc-fx:${symbol}:${interval}:${limit}`;
  const ttl = TTL_BY_INTERVAL[interval];

  const fresh = cache.get(key, ttl);
  if (fresh) return { candles: fresh.value, source: fresh.source };

  const isMetal = symbol.startsWith('XA');

  // 1. Twelve Data (requires API key, supports forex + metals, intraday)
  if (process.env.TWELVEDATA_API_KEY) {
    try {
      const twelve = require('./providers/fxTwelveData');
      const candles = await twelve.fetchOhlc(symbol, interval, limit);
      if (candles?.length > 0) {
        cache.set(key, candles, 'twelvedata');
        return { candles, source: 'twelvedata' };
      }
    } catch (err) {
      console.warn(`[ohlc-fx] TwelveData failed ${symbol}/${interval}: ${err.message}`);
    }
  }

  // 2. Alpha Vantage (free, 25 req/day with key, 5 req/min)
  if (process.env.ALPHAVANTAGE_API_KEY && !isMetal) {
    try {
      const candles = await fetchAlphaVantageOhlc(symbol, interval, limit);
      if (candles?.length > 0) {
        cache.set(key, candles, 'alphavantage');
        return { candles, source: 'alphavantage' };
      }
    } catch (err) {
      console.warn(`[ohlc-fx] AlphaVantage failed ${symbol}/${interval}: ${err.message}`);
    }
  }

  // 3. exchangerate.host timeseries (1d/1w, free, no key)
  if (['1d', '1w'].includes(interval)) {
    try {
      const candles = await fetchExchangerateHostTimeseries(symbol, interval, limit);
      if (candles?.length > 0) {
        cache.set(key, candles, 'exchangerate.host');
        return { candles, source: 'exchangerate.host' };
      }
    } catch (err) {
      console.warn(`[ohlc-fx] exchangerate.host failed ${symbol}/${interval}: ${err.message}`);
    }
  }

  // 4. Frankfurter timeseries (1d/1w, forex only, ECB data)
  if (['1d', '1w'].includes(interval) && !isMetal) {
    try {
      const candles = await fetchFrankfurterTimeseries(symbol, interval, limit);
      if (candles?.length > 0) {
        cache.set(key, candles, 'frankfurter');
        return { candles, source: 'frankfurter' };
      }
    } catch (err) {
      console.warn(`[ohlc-fx] Frankfurter failed ${symbol}/${interval}: ${err.message}`);
    }
  }

  // 5. Stale cache
  const stale = cache.get(key, 24 * 60 * 60 * 1000);
  if (stale) {
    return { candles: stale.value, source: `${stale.source}(stale)` };
  }

  // 6. Synthetic
  try {
    const synth = await generateFxSynthetic(symbol, interval, limit);
    if (synth?.length > 0) {
      cache.set(key, synth, 'synthetic');
      return { candles: synth, source: 'synthetic' };
    }
  } catch { /* ignore */ }

  return { candles: [], source: 'none' };
}

// ────────────────────────────────────────────
// ── PROVIDER IMPLEMENTATIONS ──
// ────────────────────────────────────────────

// ── Binance klines (1200 req/min, no key) ──
async function fetchBinanceKlines(binanceSymbol, interval, limit) {
  // Binance doesn't support 1w natively — use 1d and aggregate client-side
  const binanceInterval = interval === '1w' ? '1d' : interval;
  const fetchLimit = interval === '1w' ? Math.min(limit * 7, 1000) : Math.min(limit, 1000);
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${fetchLimit}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Binance ${res.status}`);
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const candles = raw.map(k => ({
      time:   Math.floor(k[0] / 1000),
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    // Aggregate 1d → 1w if needed
    if (interval === '1w') return aggregateToWeekly(candles).slice(-limit);
    return candles;
  } finally {
    clearTimeout(timer);
  }
}

// ── CoinCap OHLC (no key, good free tier) ──
async function fetchCoinCapOhlc(coincapId, interval, limit) {
  const intervalMap = {
    '1m': 'm1', '5m': 'm5', '15m': 'm15',
    '1h': 'h1', '4h': 'h4', '1d': 'd1', '1w': 'd1', // 1w: fetch d1 then aggregate
  };
  const mapped = intervalMap[interval];
  if (!mapped) return null;

  const fetchLimit = interval === '1w' ? Math.min(limit * 7, 2000) : Math.min(limit, 2000);

  // CoinCap uses time range instead of limit
  const intervalMs = { m1: 60000, m5: 300000, m15: 900000, h1: 3600000, h4: 14400000, d1: 86400000 };
  const msBack = (intervalMs[mapped] || 86400000) * fetchLimit;
  const start = Date.now() - msBack;
  const end = Date.now();

  const url = `https://api.coincap.io/v2/assets/${coincapId}/history?interval=${mapped}&start=${start}&end=${end}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CoinCap ${res.status}`);
    const json = await res.json();
    const data = json.data || [];
    if (data.length === 0) return [];

    const candles = data.map(d => ({
      time:   Math.floor(d.time / 1000),
      open:   parseFloat(d.open || d.priceUsd),
      high:   parseFloat(d.high || d.priceUsd),
      low:    parseFloat(d.low || d.priceUsd),
      close:  parseFloat(d.close || d.priceUsd),
      volume: parseFloat(d.volume || 0),
    })).filter(c => !isNaN(c.open) && !isNaN(c.close));

    if (interval === '1w') return aggregateToWeekly(candles).slice(-limit);
    return candles;
  } finally {
    clearTimeout(timer);
  }
}

// ── CryptoCompare OHLC (100k calls/month free, no key) ──
async function fetchCryptoCompareOhlc(symbol, interval, limit) {
  const endpointMap = {
    '1m':  { endpoint: 'histominute', aggregate: 1  },
    '5m':  { endpoint: 'histominute', aggregate: 5  },
    '15m': { endpoint: 'histominute', aggregate: 15 },
    '1h':  { endpoint: 'histohour',   aggregate: 1  },
    '4h':  { endpoint: 'histohour',   aggregate: 4  },
    '1d':  { endpoint: 'histoday',    aggregate: 1  },
    '1w':  { endpoint: 'histoday',    aggregate: 7  },
  };
  const { endpoint, aggregate } = endpointMap[interval] || {};
  if (!endpoint) return null;

  const fetchLimit = Math.min(limit, 2000);
  const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${symbol}&tsym=USD&limit=${fetchLimit}&aggregate=${aggregate}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CryptoCompare ${res.status}`);
    const json = await res.json();
    if (json.Response === 'Error') throw new Error(json.Message || 'CryptoCompare error');
    const data = json.Data?.Data || [];
    if (data.length === 0) return [];

    return data
      .filter(d => d.time && d.open && d.close)
      .map(d => ({
        time:   d.time,
        open:   d.open,
        high:   d.high,
        low:    d.low,
        close:  d.close,
        volume: d.volumeto || 0,
      }));
  } finally {
    clearTimeout(timer);
  }
}

// ── CoinGecko OHLC (30 req/min, use last) ──
async function fetchCoinGeckoOhlc(geckoId, interval) {
  const dayMap = { '1m': 1, '5m': 1, '15m': 1, '1h': 7, '4h': 30, '1d': 90, '1w': 365 };
  const days = dayMap[interval] || 7;
  const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) throw new Error('CoinGecko 429 rate limited');
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map(k => ({
      time:   Math.floor(k[0] / 1000),
      open:   k[1], high: k[2], low: k[3], close: k[4], volume: 0,
    }));
  } finally {
    clearTimeout(timer);
  }
}

// ── Alpha Vantage FX OHLC (5 req/min, 25/day free with key) ──
async function fetchAlphaVantageOhlc(symbol, interval, limit) {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);

  const functionMap = {
    '1h': 'FX_INTRADAY', '4h': 'FX_INTRADAY', '1d': 'FX_DAILY', '1w': 'FX_WEEKLY',
  };
  const intervalParam = { '1h': '60min', '4h': '60min' }[interval] || '';
  const fn = functionMap[interval];
  if (!fn) return null;

  let url = `https://www.alphavantage.co/query?function=${fn}&from_symbol=${base}&to_symbol=${quote}&apikey=${key}&outputsize=full`;
  if (intervalParam) url += `&interval=${intervalParam}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`AlphaVantage ${res.status}`);
    const json = await res.json();

    if (json['Note']) throw new Error('AlphaVantage rate limited');
    if (json['Error Message']) throw new Error(json['Error Message']);

    const seriesKey = Object.keys(json).find(k => k.startsWith('Time Series'));
    if (!seriesKey) return null;
    const series = json[seriesKey];

    const candles = Object.entries(series)
      .map(([date, vals]) => ({
        time:   Math.floor(new Date(date).getTime() / 1000),
        open:   parseFloat(vals['1. open']),
        high:   parseFloat(vals['2. high']),
        low:    parseFloat(vals['3. low']),
        close:  parseFloat(vals['4. close']),
        volume: 0,
      }))
      .filter(c => !isNaN(c.open))
      .sort((a, b) => a.time - b.time);

    // For 4h: aggregate 1h candles
    if (interval === '4h') return aggregateToNhour(candles, 4).slice(-limit);
    return candles.slice(-limit);
  } finally {
    clearTimeout(timer);
  }
}

// ── exchangerate.host timeseries (daily, free, no key) ──
async function fetchExchangerateHostTimeseries(symbol, interval, limit) {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);

  const days = interval === '1w' ? Math.min(limit * 7, 730) : Math.min(limit, 365);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const endStr = end.toISOString().slice(0, 10);
  const startStr = start.toISOString().slice(0, 10);

  const url = `https://api.exchangerate.host/timeseries?start_date=${startStr}&end_date=${endStr}&base=${base}&symbols=${quote}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`exchangerate.host ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error('No rates in response');

    const candles = Object.entries(data.rates)
      .map(([date, rateObj]) => {
        const rate = rateObj[quote];
        if (!rate) return null;
        return { time: Math.floor(new Date(date).getTime() / 1000), open: rate, high: rate, low: rate, close: rate, volume: 0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    if (interval === '1w') return aggregateToWeekly(candles).slice(-limit);
    return candles.slice(-limit);
  } finally {
    clearTimeout(timer);
  }
}

// ── Frankfurter timeseries (daily ECB data, forex only, no key) ──
async function fetchFrankfurterTimeseries(symbol, interval, limit) {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);
  const days = interval === '1w' ? Math.min(limit * 7, 730) : Math.min(limit, 365);
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  // Frankfurter: get rates base→quote range
  // If base is USD: from=USD&to=EUR gives USD per EUR
  // We want the pair rate: for EURUSD, base=EUR, quote=USD → 1/rate
  const url = `https://api.frankfurter.app/${start}..${end}?from=${base}&to=${quote}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = await res.json();

    const candles = Object.entries(data.rates || {})
      .map(([date, rateObj]) => {
        const rate = rateObj[quote];
        if (!rate) return null;
        return { time: Math.floor(new Date(date).getTime() / 1000), open: rate, high: rate, low: rate, close: rate, volume: 0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    if (interval === '1w') return aggregateToWeekly(candles).slice(-limit);
    return candles.slice(-limit);
  } finally {
    clearTimeout(timer);
  }
}

// ────────────────────────────────────────────
// ── AGGREGATION HELPERS ──
// ────────────────────────────────────────────

function aggregateToWeekly(dailyCandles) {
  if (!dailyCandles?.length) return [];
  const weeks = new Map();
  for (const c of dailyCandles) {
    const d = new Date(c.time * 1000);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
    monday.setUTCHours(0, 0, 0, 0);
    const wKey = Math.floor(monday.getTime() / 1000);

    if (!weeks.has(wKey)) {
      weeks.set(wKey, { time: wKey, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume });
    } else {
      const w = weeks.get(wKey);
      w.high = Math.max(w.high, c.high);
      w.low = Math.min(w.low, c.low);
      w.close = c.close;
      w.volume += c.volume;
    }
  }
  return [...weeks.values()].sort((a, b) => a.time - b.time);
}

function aggregateToNhour(candles, n) {
  if (!candles?.length) return [];
  const blocks = new Map();
  const blockMs = n * 3600;
  for (const c of candles) {
    const blockKey = Math.floor(c.time / blockMs) * blockMs;
    if (!blocks.has(blockKey)) {
      blocks.set(blockKey, { time: blockKey, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume });
    } else {
      const b = blocks.get(blockKey);
      b.high = Math.max(b.high, c.high);
      b.low = Math.min(b.low, c.low);
      b.close = c.close;
      b.volume += c.volume;
    }
  }
  return [...blocks.values()].sort((a, b) => a.time - b.time);
}

// ────────────────────────────────────────────
// ── SYNTHETIC GENERATORS ──
// ────────────────────────────────────────────

async function generateCryptoSynthetic(symbol, interval, limit) {
  let price = null;
  const listCache = cache.get('markets:list', 15 * 60 * 1000);
  if (listCache) price = listCache.value.find(r => r.symbol === symbol)?.price;

  if (!price) {
    try {
      const coincap = require('./providers/coincap');
      const rows = await coincap.fetchMarkets();
      price = rows.find(r => r.symbol === symbol)?.price;
    } catch { /* ignore */ }
  }
  if (!price) return null;

  const intervalSec = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800 }[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  let p = price * (1 - (limit * 0.0005));

  for (let i = limit - 1; i >= 0; i--) {
    const drift = (Math.random() - 0.495) * 0.002;
    p = p * (1 + drift);
    const open = p;
    const close = p * (1 + (Math.random() - 0.5) * 0.003);
    const high = Math.max(open, close) * (1 + Math.random() * 0.002);
    const low = Math.min(open, close) * (1 - Math.random() * 0.002);
    candles.push({ time: now - i * intervalSec, open, high, low, close, volume: 500 + Math.random() * 5000 });
  }
  return candles;
}

async function generateFxSynthetic(symbol, interval, limit) {
  let price = null;
  const fxCache = cache.get('forex:list', 20 * 60 * 1000);
  if (fxCache) price = fxCache.value.find(r => r.symbol === symbol)?.price;

  if (!price) {
    try {
      const ehost = require('./providers/fxExchangerateHost');
      const rows = await ehost.fetchAll();
      price = rows.find(r => r.symbol === symbol)?.price;
    } catch { /* ignore */ }
  }
  if (!price) return null;

  const intervalSec = { '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800 }[interval] || 3600;
  const isJpy = symbol.includes('JPY');
  const isMetal = symbol.startsWith('XA');
  const volatility = isMetal ? 0.003 : isJpy ? 0.0002 : 0.0001;

  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  let p = price;

  for (let i = limit - 1; i >= 0; i--) {
    const drift = (Math.random() - 0.5) * volatility * 2;
    p = p * (1 + drift);
    const open = p;
    const close = p * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    candles.push({ time: now - i * intervalSec, open, high, low, close, volume: 0 });
  }
  return candles;
}

module.exports = { getOhlc, VALID_INTERVALS };