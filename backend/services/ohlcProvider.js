// services/ohlcProvider.js
// ── OHLC CANDLE PROVIDER (CRYPTO + FX/METALS) ──

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

// ── Crypto OHLC (existing from Doc 5) ──
async function getCryptoOhlc(symbol, interval, limit) {
  if (!VALID_INTERVALS.includes(interval)) {
    const err = new Error(`Invalid interval. Use one of: ${VALID_INTERVALS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const meta = BY_SYMBOL[symbol];
  const key = `ohlc:${symbol}:${interval}:${limit}`;
  const ttl = TTL_BY_INTERVAL[interval];
  const fresh = cache.get(key, ttl);
  if (fresh) return { candles: fresh.value, source: fresh.source };

  if (meta.binanceSymbol) {
    try {
      const candles = await fetchBinanceKlines(meta.binanceSymbol, interval, limit);
      cache.set(key, candles, 'binance');
      return { candles, source: 'binance' };
    } catch (err) {
      console.warn(`[ohlc] binance failed for ${symbol}/${interval}: ${err.message}`);
    }
  }

  try {
    const candles = await fetchCoinGeckoOhlc(meta.id, interval);
    cache.set(key, candles, 'coingecko');
    return { candles, source: 'coingecko' };
  } catch (err) {
    console.warn(`[ohlc] coingecko fallback failed: ${err.message}`);
  }

  const stale = cache.get(key, 24 * 60 * 60 * 1000);
  if (stale) return { candles: stale.value, source: stale.source };
  throw new Error('No OHLC data available');
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
  const fresh = cache.get(key, ttl);
  if (fresh) return { candles: fresh.value, source: fresh.source };

  // ── Try Twelve Data first (requires API key) ──
  if (process.env.TWELVEDATA_API_KEY) {
    const twelve = require('./providers/fxTwelveData');
    try {
      const candles = await twelve.fetchOhlc(symbol, interval, limit);
      cache.set(key, candles, 'twelvedata');
      return { candles, source: 'twelvedata' };
    } catch (err) {
      console.warn(`[ohlc-fx] twelvedata failed: ${err.message}`);
    }
  }

  // ── Fallback: exchangerate.host timeseries (daily only) ──
  if (['1d', '1w'].includes(interval)) {
    try {
      const candles = await fetchExchangerateHostTimeseries(symbol, interval, limit);
      cache.set(key, candles, 'exchangerate.host');
      return { candles, source: 'exchangerate.host' };
    } catch (err) {
      console.warn(`[ohlc-fx] exchangerate.host failed: ${err.message}`);
    }
  }

  const stale = cache.get(key, 24 * 60 * 60 * 1000);
  if (stale) return { candles: stale.value, source: stale.source };
  throw new Error('No OHLC data available — premium feed may be required for this interval.');
}

// ── exchangerate.host timeseries fetch ──
async function fetchExchangerateHostTimeseries(symbol, interval, limit) {
  // Determine base/quote symbols from pair
  let base, quote;
  if (symbol.length === 6) {
    base = symbol.slice(0, 3);
    quote = symbol.slice(3);
  } else {
    const err = new Error(`Unsupported FX symbol format: ${symbol}`);
    err.statusCode = 400;
    throw err;
  }

  const days = interval === '1d' ? Math.min(limit, 365) : Math.min(limit * 7, 730);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const endStr = endDate.toISOString().slice(0, 10);
  const startStr = startDate.toISOString().slice(0, 10);

  const url = `https://api.exchangerate.host/timeseries?start_date=${startStr}&end_date=${endStr}&base=${base}&symbols=${quote}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`exchangerate.host timeseries ${res.status}`);
    const data = await res.json();
    const rates = data.rates || {};

    const candles = Object.entries(rates)
      .map(([date, rateObj]) => {
        const rate = rateObj[quote];
        if (!rate) return null;
        return {
          time:   Math.floor(new Date(date).getTime() / 1000),
          open:   rate,
          high:   rate,
          low:    rate,
          close:  rate,
          volume: 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    return candles;
  } finally {
    clearTimeout(timer);
  }
}

// ── Binance Klines ──
async function fetchBinanceKlines(binanceSymbol, interval, limit) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Binance klines ${res.status}`);
    const raw = await res.json();
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

// ── CoinGecko OHLC ──
async function fetchCoinGeckoOhlc(geckoId, interval) {
  const dayMap = { '1m': 1, '5m': 1, '15m': 1, '1h': 7, '4h': 30, '1d': 90, '1w': 365 };
  const days = dayMap[interval] || 7;
  const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`CoinGecko ohlc ${res.status}`);
    const raw = await res.json();
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

module.exports = { getOhlc, VALID_INTERVALS };