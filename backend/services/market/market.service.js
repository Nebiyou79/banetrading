// services/market/market.service.js
// ── PUBLIC API FACADE — crypto + forex + metals with synthetic fallback ──

const {
  getAggregatedPrice,
  getAggregatedCandles,
  getAggregatedMarkets,
  getProviderHealth,
} = require('./market.aggregator');

const {
  getCachedPrice, setCachedPrice,
  getCachedCandles, setCachedCandles,
  getCachedMarkets, setCachedMarkets,
} = require('./cache/market.cache');

const { normalizeSymbol } = require('./symbols/symbol.map');

// ── Lazy-load forex aggregator ──
let _forexAgg = null;
function getForexAggregator() {
  if (!_forexAgg) {
    try { _forexAgg = require('../../services/forexAggregator'); } catch { _forexAgg = null; }
  }
  return _forexAgg;
}

// ── Asset class detection ──
function isCrypto(sym)  { return sym.endsWith('USDT') && !sym.startsWith('XA'); }
function isForex(sym)   { return ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD'].includes(sym); }
function isMetal(sym)   { return sym.startsWith('XA'); }

// ── Realistic base prices (update periodically) ──
const CRYPTO_BASE = {
  BTCUSDT:  87600,  ETHUSDT:  3520,   BNBUSDT:  600,
  SOLUSDT:  145,    XRPUSDT:  0.62,   ADAUSDT:  0.48,
  DOGEUSDT: 0.15,   TRXUSDT:  0.12,   MATICUSDT:0.72,
  DOTUSDT:  7.2,    LTCUSDT:  84,     AVAXUSDT: 36,
  LINKUSDT: 14,     BCHUSDT:  480,    UNIUSDT:  8,
  ATOMUSDT: 8.5,    ETCUSDT:  28,
};
const FOREX_BASE  = { EURUSD: 1.0850, GBPUSD: 1.2700, USDJPY: 149.50, USDCHF: 0.9000, AUDUSD: 0.6500 };
const METALS_BASE = { XAUUSD: 3300, XAGUSD: 30 };

function getBasePrice(sym) {
  return CRYPTO_BASE[sym] || FOREX_BASE[sym] || METALS_BASE[sym] || 1;
}

// ── Candle generators ──
function generateCryptoSynthetic(symbol, interval, limit) {
  const secMap = { '1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400,'1w':604800 };
  const sec = secMap[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const base = CRYPTO_BASE[symbol] || 100;
  const vol = base < 1 ? 0.005 : base < 100 ? 0.002 : 0.001;
  const dp = base < 1 ? 6 : base < 100 ? 4 : 2;
  let p = base;
  return Array.from({ length: limit }, (_, i) => {
    p = Math.max(p * (1 + (Math.random() - 0.495) * vol), p * 0.3);
    const open  = +p.toFixed(dp);
    const close = +(p * (1 + (Math.random() - 0.5) * vol * 0.8)).toFixed(dp);
    const high  = +(Math.max(open, close) * (1 + Math.random() * vol * 0.3)).toFixed(dp);
    const low   = +(Math.min(open, close) * (1 - Math.random() * vol * 0.3)).toFixed(dp);
    return { time: now - (limit - 1 - i) * sec, open, high, low, close, volume: Math.floor(500 + Math.random() * 10000) };
  });
}

function generateForexSynthetic(symbol, interval, limit) {
  const secMap = { '1h':3600,'4h':14400,'1d':86400,'1w':604800 };
  const sec = secMap[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const isJPY = symbol.includes('JPY');
  const base = FOREX_BASE[symbol] || 1;
  const vol = isJPY ? 0.0003 : 0.00005;
  const dp  = isJPY ? 3 : 4;
  let p = base;
  return Array.from({ length: limit }, (_, i) => {
    p += (Math.random() - 0.5) * vol * p * 2;
    const open  = +p.toFixed(dp);
    const close = +(p * (1 + (Math.random() - 0.5) * vol)).toFixed(dp);
    const high  = +(Math.max(open, close) * (1 + Math.abs(vol) * Math.random())).toFixed(dp);
    const low   = +(Math.min(open, close) * (1 - Math.abs(vol) * Math.random())).toFixed(dp);
    return { time: now - (limit - 1 - i) * sec, open, high, low, close, volume: 0 };
  });
}

function generateMetalSynthetic(symbol, interval, limit) {
  const secMap = { '1h':3600,'4h':14400,'1d':86400,'1w':604800 };
  const sec = secMap[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const base = symbol.includes('XAU') ? 3300 : 30;
  const vol  = 0.001;
  let p = base;
  return Array.from({ length: limit }, (_, i) => {
    p += (Math.random() - 0.5) * vol * p * 2;
    const open  = +p.toFixed(2);
    const close = +(p * (1 + (Math.random() - 0.5) * vol)).toFixed(2);
    const high  = +(Math.max(open, close) * (1 + Math.random() * vol)).toFixed(2);
    const low   = +(Math.min(open, close) * (1 - Math.random() * vol)).toFixed(2);
    return { time: now - (limit - 1 - i) * sec, open, high, low, close, volume: 0 };
  });
}

// ── Candle validator ──
function validateCandles(candles) {
  if (!Array.isArray(candles)) return [];
  return candles.filter(c => {
    if (!c || !c.time || c.time <= 0) return false;
    const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
    return !isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(cl) && o > 0 && h > 0 && l > 0 && cl > 0 && l <= h && h < o * 100;
  }).map(c => ({
    time: Number(c.time), open: Number(c.open), high: Number(c.high),
    low: Number(c.low), close: Number(c.close), volume: Number(c.volume || 0),
  }));
}

// ── PUBLIC API ──

/**
 * Get current price for any symbol.
 * Returns { symbol, price, change24h, timestamp, provider }
 */
async function getPrice(symbol) {
  const normalized = (normalizeSymbol(symbol) || symbol).toUpperCase();

  const cached = await getCachedPrice(normalized).catch(() => null);
  if (cached?.price) return cached;

  // Forex/metals: use forex aggregator first
  if (isForex(normalized) || isMetal(normalized)) {
    const fx = getForexAggregator();
    if (fx) {
      try {
        const { rows } = await fx.getForexAndMetals();
        const row = rows.find(r => r.symbol === normalized);
        if (row?.price && row.price > 0) {
          const result = { symbol: normalized, price: row.price, change24h: row.change24h || 0, timestamp: Date.now(), provider: 'forex-aggregator' };
          await setCachedPrice(normalized, result).catch(() => {});
          return result;
        }
      } catch (e) {
        console.warn(`[market.service] forex aggregator failed for ${normalized}: ${e.message}`);
      }
    }
    // Synthetic for forex/metals
    return { symbol: normalized, price: getBasePrice(normalized), change24h: 0, timestamp: Date.now(), provider: 'synthetic' };
  }

  // Crypto: try aggregator
  try {
    const result = await getAggregatedPrice(normalized);
    if (result?.data?.price > 0) {
      await setCachedPrice(normalized, result.data).catch(() => {});
      return result.data;
    }
  } catch (e) {
    console.warn(`[market.service] aggregator failed for ${normalized}: ${e.message}`);
  }

  // Synthetic crypto
  return { symbol: normalized, price: getBasePrice(normalized), change24h: 0, timestamp: Date.now(), provider: 'synthetic' };
}

/**
 * Get OHLC candles for any symbol and interval.
 * Always returns an array (synthetic if providers fail).
 */
async function getCandles(symbol, interval = '1h', limit = 300) {
  const normalized = (normalizeSymbol(symbol) || symbol).toUpperCase();

  const cached = await getCachedCandles(normalized, interval).catch(() => null);
  if (Array.isArray(cached) && cached.length > 0) return validateCandles(cached);

  let candles = [];

  // Crypto: try aggregator
  if (isCrypto(normalized)) {
    try {
      const result = await getAggregatedCandles(normalized, interval, limit);
      if (result?.data?.length > 0) candles = result.data;
    } catch (e) {
      console.warn(`[market.service] aggregator candles failed for ${normalized}/${interval}: ${e.message}`);
    }
  }

  // Forex/metals: aggregator handles these too (TwelveData, Frankfurter, etc.)
  if (candles.length === 0 && (isForex(normalized) || isMetal(normalized))) {
    try {
      const result = await getAggregatedCandles(normalized, interval, limit);
      if (result?.data?.length > 0) candles = result.data;
    } catch (e) {
      console.warn(`[market.service] forex candles failed for ${normalized}/${interval}: ${e.message}`);
    }
  }

  // Synthetic fallback
  if (candles.length === 0) {
    if (isMetal(normalized))     candles = generateMetalSynthetic(normalized, interval, limit);
    else if (isForex(normalized)) candles = generateForexSynthetic(normalized, interval, limit);
    else                          candles = generateCryptoSynthetic(normalized, interval, limit);
  }

  const valid = validateCandles(candles);
  await setCachedCandles(normalized, interval, valid).catch(() => {});
  return valid;
}

/**
 * Get full market list (crypto only).
 * Falls back to synthetic prices if providers fail.
 */
async function getMarkets() {
  const cached = await getCachedMarkets().catch(() => null);
  if (Array.isArray(cached) && cached.length > 0) return cached;

  try {
    const result = await getAggregatedMarkets();
    if (result?.data?.length > 0) {
      await setCachedMarkets(result.data).catch(() => {});
      return result.data;
    }
  } catch (e) {
    console.warn(`[market.service] getAggregatedMarkets failed: ${e.message}`);
  }

  // Synthetic market list
  const synth = Object.entries(CRYPTO_BASE).map(([sym, price]) => ({
    symbol:    sym,
    name:      sym.replace('USDT', ''),
    price,
    change24h: +(Math.random() - 0.48) * 5,
    volume24h: Math.floor(1e8 + Math.random() * 9e9),
    marketCap: null,
    high24h:   +(price * (1 + Math.random() * 0.03)).toFixed(2),
    low24h:    +(price * (1 - Math.random() * 0.03)).toFixed(2),
    image:     null,
  }));
  return synth;
}

/**
 * Search assets by name or symbol.
 */
async function searchAssets(query) {
  const markets = await getMarkets().catch(() => []);
  const q = query.toLowerCase();
  return markets.filter(m => m.symbol?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q));
}

/**
 * Get provider health status.
 */
async function getHealth() {
  try {
    return await getProviderHealth();
  } catch {
    return { success: true, data: [] };
  }
}

module.exports = { getPrice, getCandles, getMarkets, searchAssets, getHealth };