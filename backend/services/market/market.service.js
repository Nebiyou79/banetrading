// services/market/market.service.js
// ── MARKET SERVICE — orchestrates aggregator + cache + synthetic fallback ──
// FIX: Add COIN_IMAGES map; validateCandles(); synthetic candles never have low>high or NaN

const { getAggregatedMarkets, getAggregatedPrice, getAggregatedCandles, COIN_IMAGES } = require('./market.aggregator');

// ── In-memory cache (simple TTL map, Redis optional) ──
const memCache = new Map();

function cacheGet(key, ttlMs) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) return null;
  return entry.value;
}

function cacheSet(key, value) {
  memCache.set(key, { value, ts: Date.now() });
}

// Try Redis if available
let redis = null;
try {
  const { getRedisClient } = require('./redis.client');
  redis = getRedisClient();
} catch { /* Redis optional */ }

async function redisGet(key) {
  try { return redis ? await redis.get(key) : null; } catch { return null; }
}

async function redisSet(key, value, ttlSec) {
  try { if (redis) await redis.set(key, JSON.stringify(value), { ex: ttlSec }); } catch {}
}

// ── TTLs ──
const TTL = {
  MARKETS: 60,   // 60s
  PRICE:   10,   // 10s
  CANDLES: 60,   // 60s
};

// ── Synthetic base prices (fallback when all providers fail) ──
const SYNTHETIC_PRICES = {
  BTCUSDT: 81500, ETHUSDT: 3500, BNBUSDT: 650, SOLUSDT: 180,
  XRPUSDT: 0.55,  ADAUSDT: 0.45, DOGEUSDT: 0.08, TRXUSDT: 0.12,
  MATICUSDT: 0.55, DOTUSDT: 7.0, LTCUSDT: 95, AVAXUSDT: 38,
  LINKUSDT: 15, BCHUSDT: 450, UNIUSDT: 8, ATOMUSDT: 7,
  ETCUSDT: 28,
  FILUSDT: 5, APTUSDT: 6, ARBUSDT: 0.50,
  EURUSD: 1.17, GBPUSD: 1.34, USDJPY: 155, USDCHF: 0.85, AUDUSD: 0.66,
  XAUUSD: 4680, XAGUSD: 30,
};

// ── Candle validation ──
function validateCandles(candles) {
  if (!Array.isArray(candles)) return [];
  return candles.filter(c => {
    if (!c || !c.time || c.time <= 0) return false;
    const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(cl)) return false;
    if (o <= 0 || h <= 0 || l <= 0 || cl <= 0) return false;
    if (l > h) return false; // low must not exceed high
    return true;
  }).map(c => ({
    time:   Number(c.time) > 9999999999 ? Math.floor(Number(c.time) / 1000) : Number(c.time),
    open:   Number(c.open),
    high:   Number(c.high),
    low:    Number(c.low),
    close:  Number(c.close),
    volume: Number(c.volume) || 0,
  }));
}

// ── Synthetic candle generator — always valid, never NaN, low<=high ──
function generateSyntheticCandles(symbol, interval, limit) {
  const basePrice = SYNTHETIC_PRICES[symbol] || 100;
  const intervalSec = {
    '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
    '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
  }[interval] || 3600;

  const isFx    = symbol.length === 6 && !symbol.endsWith('USDT');
  const isMetal = symbol.startsWith('XA');
  const volatility = isMetal ? 0.003 : isFx ? 0.0002 : 0.008;

  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  let p = basePrice * (1 - limit * volatility * 0.1);

  for (let i = limit; i >= 1; i--) {
    const drift = (Math.random() - 0.495) * volatility * 2;
    p = Math.max(p * (1 + drift), basePrice * 0.3); // floor at 30% of base

    const bodyPct = Math.random() * volatility;
    const open    = p;
    const close   = p * (1 + (Math.random() > 0.5 ? bodyPct : -bodyPct));
    const wickTop = Math.random() * volatility * 0.5;
    const wickBot = Math.random() * volatility * 0.5;
    const high    = Math.max(open, close) * (1 + wickTop);
    const low     = Math.min(open, close) * (1 - wickBot);

    // Guard: ensure low <= high (always true above, but defensive)
    candles.push({
      time:   now - (i - 1) * intervalSec,
      open:   +open.toFixed(8),
      high:   +high.toFixed(8),
      low:    +Math.min(low, high).toFixed(8),
      close:  +close.toFixed(8),
      volume: isFx || isMetal ? 0 : +(500 + Math.random() * 10000).toFixed(2),
    });
  }

  return candles;
}

// ── Get markets list ──
async function getMarkets() {
  const key = 'markets:list';

  // 1. In-memory cache
  const mem = cacheGet(key, TTL.MARKETS * 1000);
  if (mem) return mem;

  // 2. Redis cache
  const cached = await redisGet(key);
  if (cached) {
    try {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      cacheSet(key, parsed);
      return parsed;
    } catch {}
  }

  // 3. Fetch from providers
  const { data: markets, provider } = await getAggregatedMarkets();

  if (markets && markets.length > 0) {
    // Ensure all markets have images
    const withImages = markets.map(m => ({
      ...m,
      image: m.image || COIN_IMAGES[m.symbol?.replace('USDT', '')] || null,
    }));
    cacheSet(key, withImages);
    await redisSet(key, withImages, TTL.MARKETS);
    return withImages;
  }

  console.warn('[market.service] All providers failed for getMarkets — returning empty');
  return [];
}

// ── Get single price ──
async function getPrice(symbol) {
  const key = `price:${symbol}`;

  const mem = cacheGet(key, TTL.PRICE * 1000);
  if (mem) return mem;

  const cached = await redisGet(key);
  if (cached) {
    try {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      cacheSet(key, parsed);
      return parsed;
    } catch {}
  }

  const price = await getAggregatedPrice(symbol);
  if (price?.price > 0) {
    cacheSet(key, price);
    await redisSet(key, price, TTL.PRICE);
    return price;
  }

  // Synthetic fallback
  const syntheticPrice = SYNTHETIC_PRICES[symbol];
  if (syntheticPrice) {
    const result = { symbol, price: syntheticPrice, change24h: 0, provider: 'synthetic', timestamp: Date.now() };
    return result;
  }

  return null;
}

// ── Get OHLC candles ──
async function getCandles(symbol, interval, limit = 300) {
  const key = `candles:${symbol}:${interval}:${limit}`;

  const mem = cacheGet(key, TTL.CANDLES * 1000);
  if (mem) return mem;

  const cached = await redisGet(key);
  if (cached) {
    try {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const valid = validateCandles(parsed);
      if (valid.length > 0) {
        cacheSet(key, valid);
        return valid;
      }
    } catch {}
  }

  // Fetch from providers
  const { data: rawCandles } = await getAggregatedCandles(symbol, interval, limit);
  const candles = validateCandles(rawCandles);

  if (candles.length >= 5) {
    cacheSet(key, candles);
    await redisSet(key, candles, TTL.CANDLES);
    return candles;
  }

  // Stale cache fallback
  const staleKey = `stale:${key}`;
  const stale = cacheGet(staleKey, 24 * 60 * 60 * 1000);
  if (stale && stale.length >= 5) {
    console.warn(`[market.service] Serving stale candles for ${symbol}/${interval}`);
    return stale;
  }

  // Always-available synthetic fallback
  console.warn(`[market.service] Using synthetic candles for ${symbol}/${interval}`);
  const synthetic = generateSyntheticCandles(symbol, interval, limit);
  cacheSet(staleKey, synthetic); // cache for future stale use
  return synthetic;
}

// ── Search assets ──
async function searchAssets(query) {
  const q = query.toLowerCase();
  const markets = await getMarkets();
  return markets.filter(m =>
    m.symbol?.toLowerCase().includes(q) ||
    m.name?.toLowerCase().includes(q)
  ).slice(0, 20);
}

// ── Health check ──
async function getHealth() {
  const { getProviderHealth } = require('./market.aggregator');
  return getProviderHealth();
}

module.exports = {
  getMarkets,
  getPrice,
  getCandles,
  searchAssets,
  getHealth,
  validateCandles,
  generateSyntheticCandles,
  COIN_IMAGES,
};