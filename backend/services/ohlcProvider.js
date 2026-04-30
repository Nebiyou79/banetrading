// services/ohlcProvider.js
// ── OHLC CANDLE PROVIDER WITH RATE LIMITING ──

const cache = require('./priceCache');
const { BY_SYMBOL } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

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
const FETCH_TIMEOUT_MS = 8000;

// ── Rate limiter for CoinGecko ──
const coingeckoQueue = [];
let coingeckoLastCall = 0;
const COINGECKO_MIN_INTERVAL = 2000; // 2 seconds between calls

async function rateLimitedCoinGeckoCall(fn) {
  const now = Date.now();
  const waitTime = Math.max(0, COINGECKO_MIN_INTERVAL - (now - coingeckoLastCall));
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  coingeckoLastCall = Date.now();
  return fn();
}

// ── CoinGecko ID overrides ──
const GECKO_ID_MAP = {
  'MATIC': 'matic-network', 'BNB': 'binancecoin', 'USDT': 'tether',
  'ADA': 'cardano', 'SOL': 'solana', 'DOT': 'polkadot',
  'AVAX': 'avalanche-2', 'LINK': 'chainlink', 'BCH': 'bitcoin-cash',
  'LTC': 'litecoin', 'XRP': 'ripple', 'DOGE': 'dogecoin', 'TRX': 'tron',
};

function getGeckoId(symbol) {
  return GECKO_ID_MAP[symbol] || BY_SYMBOL[symbol]?.id || symbol.toLowerCase();
}

// ── Main router ──
async function getOhlc(symbol, interval = '1h', limit = 500) {
  const symUpper = symbol.toUpperCase();

  if (BY_SYMBOL[symUpper]) {
    return getCryptoOhlc(symUpper, interval, limit);
  }

  if (FX_BY_SYMBOL[symUpper] || METAL_BY_SYMBOL[symUpper]) {
    return getFxOhlc(symUpper, interval, limit);
  }

  const err = new Error(`Unknown symbol: ${symbol}`);
  err.statusCode = 404;
  throw err;
}

// ── Crypto OHLC — Cache-first, CoinGecko with rate limiting ──
async function getCryptoOhlc(symbol, interval, limit) {
  if (!VALID_INTERVALS.includes(interval)) {
    const err = new Error(`Invalid interval. Use one of: ${VALID_INTERVALS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const key = `ohlc:${symbol}:${interval}:${limit}`;
  const ttl = TTL_BY_INTERVAL[interval];

  // 1. Return cached data immediately (even if slightly stale)
  const fresh = cache.get(key, ttl);
  if (fresh) return { candles: fresh.value, source: fresh.source };

  // 2. Try CoinGecko with rate limiting
  const geckoId = getGeckoId(symbol);
  try {
    const candles = await rateLimitedCoinGeckoCall(() => fetchCoinGeckoOhlc(geckoId, interval));
    if (candles && candles.length > 0) {
      cache.set(key, candles, 'coingecko');
      return { candles, source: 'coingecko' };
    }
  } catch (err) {
    if (err.message.includes('429')) {
      console.warn(`[ohlc] CoinGecko rate limited for ${symbol}/${interval} — using fallback`);
    } else {
      console.warn(`[ohlc] coingecko failed for ${geckoId}/${interval}: ${err.message}`);
    }
  }

  // 3. Try Binance (may be blocked)
  const meta = BY_SYMBOL[symbol];
  if (meta?.binanceSymbol) {
    try {
      const candles = await fetchBinanceKlines(meta.binanceSymbol, interval, limit);
      if (candles && candles.length > 0) {
        cache.set(key, candles, 'binance');
        return { candles, source: 'binance' };
      }
    } catch (err) {
      // Silently skip — Binance is likely blocked
    }
  }

  // 4. Try CoinCap
  try {
    const candles = await fetchCoinCapOhlc(symbol, interval, limit);
    if (candles && candles.length > 0) {
      cache.set(key, candles, 'coincap');
      return { candles, source: 'coincap' };
    }
  } catch (err) {
    // Silently skip
  }

  // 5. Generate synthetic candles
  try {
    const syntheticCandles = await generateCryptoCandles(symbol, interval, limit);
    if (syntheticCandles && syntheticCandles.length > 0) {
      cache.set(key, syntheticCandles, 'synthetic');
      return { candles: syntheticCandles, source: 'synthetic' };
    }
  } catch (err) {
    console.warn(`[ohlc] synthetic failed for ${symbol}/${interval}: ${err.message}`);
  }

  // 6. Stale cache (up to 1 day old)
  const stale = cache.get(key, 24 * 60 * 60 * 1000);
  if (stale) return { candles: stale.value, source: stale.source };

  // 7. Return empty
  console.warn(`[ohlc] All providers failed for ${symbol}/${interval} — returning empty data`);
  return { candles: [], source: 'none' };
}

// ── FX / Metals OHLC ──
async function getFxOhlc(symbol, interval, limit) {
  if (!VALID_INTERVALS.includes(interval)) {
    const err = new Error(`Invalid interval. Use one of: ${VALID_INTERVALS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (['1m', '5m', '15m'].includes(interval)) {
    const err = new Error('Sub-hourly intervals require a premium data feed for FX/Metals.');
    err.statusCode = 400;
    throw err;
  }

  const key = `ohlc-fx:${symbol}:${interval}:${limit}`;
  const ttl = TTL_BY_INTERVAL[interval];

  // 1. Fresh cache
  const fresh = cache.get(key, ttl);
  if (fresh) return { candles: fresh.value, source: fresh.source };

  // 2. exchangerate.host (1d/1w)
  if (['1d', '1w'].includes(interval)) {
    try {
      const candles = await fetchExchangerateHostTimeseries(symbol, interval, limit);
      if (candles && candles.length > 0) {
        cache.set(key, candles, 'exchangerate.host');
        return { candles, source: 'exchangerate.host' };
      }
    } catch (err) {
      // Silently skip
    }
  }

  // 3. Twelve Data for forex (skip metals)
  const isMetal = symbol.startsWith('XA');
  if (process.env.TWELVEDATA_API_KEY && !isMetal) {
    const twelve = require('./providers/fxTwelveData');
    try {
      const candles = await twelve.fetchOhlc(symbol, interval, limit);
      if (candles && candles.length > 0) {
        cache.set(key, candles, 'twelvedata');
        return { candles, source: 'twelvedata' };
      }
    } catch (err) {
      // Silently skip
    }
  }

  // 4. Synthetic candles
  try {
    const syntheticCandles = await generateSyntheticCandles(symbol, interval, limit);
    if (syntheticCandles && syntheticCandles.length > 0) {
      cache.set(key, syntheticCandles, 'synthetic');
      return { candles, source: 'synthetic' };
    }
  } catch (err) {
    // Silently skip
  }

  // 5. Stale cache
  const stale = cache.get(key, 24 * 60 * 60 * 1000);
  if (stale) return { candles: stale.value, source: stale.source };

  return { candles: [], source: 'none' };
}

// ── CoinGecko OHLC ──
async function fetchCoinGeckoOhlc(geckoId, interval) {
  const dayMap = { '1m': 1, '5m': 1, '15m': 1, '1h': 7, '4h': 30, '1d': 90, '1w': 365 };
  const days = dayMap[interval] || 7;
  const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) throw new Error('CoinGecko ohlc 429');
    if (!res.ok) throw new Error(`CoinGecko ohlc ${res.status}`);
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map(k => ({
      time:   Math.floor(k[0] / 1000),
      open:   k[1],
      high:   k[2],
      low:    k[3],
      close:  k[4],
      volume: 0,
    }));
  } finally {
    clearTimeout(timer);
  }
}

// ── Binance Klines ──
async function fetchBinanceKlines(binanceSymbol, interval, limit) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Binance klines ${res.status}`);
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map(k => ({
      time:   Math.floor(k[0] / 1000),
      open:   parseFloat(k[1]),
      high:   parseFloat(k[2]),
      low:    parseFloat(k[3]),
      close:  parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } finally {
    clearTimeout(timer);
  }
}

// ── CoinCap OHLC ──
async function fetchCoinCapOhlc(symbol, interval, limit = 500) {
  const intervalMap = {
    '1m': 'm1', '5m': 'm5', '15m': 'm15',
    '1h': 'h1', '4h': 'h4', '1d': 'd1', '1w': 'w1',
  };
  const mappedInterval = intervalMap[interval];
  if (!mappedInterval) return null;

  const coinCapIdMap = {
    'MATIC': 'polygon', 'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether',
    'BNB': 'binance-coin', 'SOL': 'solana', 'XRP': 'xrp',
    'ADA': 'cardano', 'DOGE': 'dogecoin', 'TRX': 'tron',
    'DOT': 'polkadot', 'LTC': 'litecoin', 'AVAX': 'avalanche',
    'LINK': 'chainlink', 'BCH': 'bitcoin-cash',
  };
  const id = coinCapIdMap[symbol] || symbol.toLowerCase();

  const url = `https://api.coincap.io/v2/assets/${id}/history?interval=${mappedInterval}&limit=${limit}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data || [];
    if (data.length === 0) return [];
    return data.map(d => ({
      time:   Math.floor(d.time / 1000),
      open:   parseFloat(d.open || d.priceUsd),
      high:   parseFloat(d.high || d.priceUsd),
      low:    parseFloat(d.low || d.priceUsd),
      close:  parseFloat(d.close || d.priceUsd),
      volume: parseFloat(d.volume || 0),
    }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Synthetic crypto candles (use coincap, not priceAggregator) ──
async function generateCryptoCandles(symbol, interval, limit = 500) {
  // Use CoinCap directly instead of priceAggregator (saves CoinGecko quota)
  let currentPrice = null;
  try {
    const coincap = require('./providers/coincap');
    const rows = await coincap.fetchMarkets();
    const row = rows.find(r => r.symbol === symbol);
    if (row?.price) currentPrice = row.price;
  } catch { /* ignore */ }
  
  if (!currentPrice) {
    // Last resort: try cached market list
    const listCache = cache.get('markets:list', 10 * 60 * 1000);
    if (listCache) {
      const row = listCache.value.find(r => r.symbol === symbol);
      if (row?.price) currentPrice = row.price;
    }
  }
  
  if (!currentPrice) return null;

  const intervalSeconds = {
    '1m': 60, '5m': 300, '15m': 900,
    '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
  }[interval] || 3600;

  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    const jitter = 1 + (Math.random() - 0.5) * 0.004;
    const price = currentPrice * jitter;
    candles.push({
      time, open: price * 0.9998, high: price * 1.001,
      low: price * 0.998, close: price, volume: 1000 + Math.random() * 5000,
    });
  }
  return candles;
}

// ── Synthetic forex candles (use exchangerate.host, not forexAggregator) ──
async function generateSyntheticCandles(symbol, interval, limit = 500) {
  let currentPrice = null;
  
  // Try exchangerate.host directly
  try {
    const ehost = require('./providers/fxExchangerateHost');
    const rows = await ehost.fetchAll();
    const row = rows.find(r => r.symbol === symbol);
    if (row?.price) currentPrice = row.price;
  } catch { /* ignore */ }
  
  if (!currentPrice) {
    const fxCache = cache.get('forex:list', 15 * 60 * 1000);
    if (fxCache) {
      const row = fxCache.value.find(r => r.symbol === symbol);
      if (row?.price) currentPrice = row.price;
    }
  }
  
  if (!currentPrice) return null;

  const intervalSeconds = {
    '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
  }[interval] || 3600;

  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  const pipSize = symbol.includes('JPY') ? 0.0001 : 0.00001;
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    const jitter = 1 + (Math.random() - 0.5) * pipSize * 20;
    const price = currentPrice * jitter;
    candles.push({
      time, open: price * 0.9999, high: price * 1.0001,
      low: price * 0.9998, close: price, volume: 0,
    });
  }
  return candles;
}

// ── exchangerate.host timeseries ──
async function fetchExchangerateHostTimeseries(symbol, interval, limit) {
  let base, quote;
  if (symbol.length === 6) {
    base = symbol.slice(0, 3);
    quote = symbol.slice(3);
  } else return null;

  const days = interval === '1d' ? Math.min(limit, 365) : Math.min(limit * 7, 730);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  const endStr = endDate.toISOString().slice(0, 10);
  const startStr = startDate.toISOString().slice(0, 10);

  const url = `https://api.exchangerate.host/timeseries?start_date=${startStr}&end_date=${endStr}&base=${base}&symbols=${quote}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const rates = data.rates || {};
    const candles = Object.entries(rates)
      .map(([date, rateObj]) => {
        const rate = rateObj[quote];
        if (!rate) return null;
        return { time: Math.floor(new Date(date).getTime() / 1000), open: rate, high: rate, low: rate, close: rate, volume: 0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
    return candles.length > 0 ? candles : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getOhlc, VALID_INTERVALS };
