// src/services/market/market.service.js
// ── PUBLIC API FACADE (uses both market.aggregator + forexAggregator) ──

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
let _forexAggregator = null;
function getForexAggregator() {
  if (!_forexAggregator) {
    try { _forexAggregator = require('../../services/forexAggregator'); } catch { _forexAggregator = null; }
  }
  return _forexAggregator;
}

// ── Synthetic generators ──

function generateCryptoSynthetic(symbol, interval, limit) {
  const intervalSec = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800 };
  const sec = intervalSec[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);

  const basePrices = {
    'BTCUSDT': 67600, 'ETHUSDT': 3500, 'BNBUSDT': 600, 'SOLUSDT': 145,
    'XRPUSDT': 0.62, 'ADAUSDT': 0.48, 'DOGEUSDT': 0.15, 'MATICUSDT': 0.72,
    'DOTUSDT': 7.2, 'LTCUSDT': 84, 'LINKUSDT': 14, 'AVAXUSDT': 36,
    'TRXUSDT': 0.12, 'BCHUSDT': 480, 'UNIUSDT': 8, 'ATOMUSDT': 8.5, 'ETCUSDT': 28,
  };

  let price = basePrices[symbol] || 100;
  const volatility = price < 1 ? 0.005 : price < 100 ? 0.002 : 0.001;
  const candles = [];
  for (let i = limit - 1; i >= 0; i--) {
    const change = (Math.random() - 0.495) * volatility * price;
    price = Math.max(price + change, price * 0.3);
    const open = Number(price.toFixed(price < 1 ? 6 : price < 100 ? 4 : 2));
    const close = Number((price * (1 + (Math.random() - 0.5) * volatility * 0.8)).toFixed(price < 1 ? 6 : price < 100 ? 4 : 2));
    const high = Number((Math.max(open, close) * (1 + Math.random() * volatility * 0.3)).toFixed(price < 1 ? 6 : price < 100 ? 4 : 2));
    const low = Number((Math.min(open, close) * (1 - Math.random() * volatility * 0.3)).toFixed(price < 1 ? 6 : price < 100 ? 4 : 2));
    candles.push({ time: now - i * sec, open, high, low, close, volume: Math.floor(500 + Math.random() * 10000) });
  }
  return candles;
}

function generateForexSynthetic(symbol, interval, limit) {
  const intervalSec = { '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800 };
  const sec = intervalSec[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const basePrices = { 'EURUSD': 1.0850, 'GBPUSD': 1.2700, 'USDJPY': 149.50, 'USDCHF': 0.9000, 'AUDUSD': 0.6500 };
  let price = basePrices[symbol] || 1.0;
  const isJPY = symbol.includes('JPY');
  const volatility = isJPY ? 0.0003 : 0.00005;
  const decimals = isJPY ? 3 : 4;
  const candles = [];
  for (let i = limit - 1; i >= 0; i--) {
    const change = (Math.random() - 0.5) * volatility * price * 2;
    price = price + change;
    const open = Number(price.toFixed(decimals));
    const close = Number((price * (1 + (Math.random() - 0.5) * volatility)).toFixed(decimals));
    const high = Number((Math.max(open, close) * (1 + Math.abs(volatility) * Math.random())).toFixed(decimals));
    const low = Number((Math.min(open, close) * (1 - Math.abs(volatility) * Math.random())).toFixed(decimals));
    candles.push({ time: now - i * sec, open, high, low, close, volume: 0 });
  }
  return candles;
}

function generateMetalSynthetic(symbol, interval, limit) {
  const intervalSec = { '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800 };
  const sec = intervalSec[interval] || 3600;
  const now = Math.floor(Date.now() / 1000);
  const isGold = symbol.includes('XAU');
  let price = isGold ? 3300 : 30;
  const volatility = 0.001;
  const candles = [];
  for (let i = limit - 1; i >= 0; i--) {
    const change = (Math.random() - 0.5) * volatility * price * 2;
    price = price + change;
    const open = Number(price.toFixed(2));
    const close = Number((price * (1 + (Math.random() - 0.5) * volatility)).toFixed(2));
    const high = Number((Math.max(open, close) * (1 + Math.abs(volatility) * Math.random())).toFixed(2));
    const low = Number((Math.min(open, close) * (1 - Math.abs(volatility) * Math.random())).toFixed(2));
    candles.push({ time: now - i * sec, open, high, low, close, volume: 0 });
  }
  return candles;
}

function validateCandles(candles) {
  if (!Array.isArray(candles)) return [];
  return candles.filter((c) => {
    if (!c || typeof c !== 'object') return false;
    if (!c.time || c.time <= 0) return false;
    const open = Number(c.open), high = Number(c.high), low = Number(c.low), close = Number(c.close);
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return false;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return false;
    if (low > high) return false;
    if (high > open * 100 && open > 1) return false;
    return true;
  }).map(c => ({
    time: Number(c.time), open: Number(c.open), high: Number(c.high),
    low: Number(c.low), close: Number(c.close), volume: Number(c.volume || 0),
  }));
}

function isCrypto(symbol) { return symbol.endsWith('USDT') && !symbol.startsWith('XA'); }
function isForex(symbol) { return ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD'].includes(symbol); }
function isMetal(symbol) { return symbol.startsWith('XA'); }

// ── PUBLIC API ──

async function getPrice(symbol) {
  const normalized = normalizeSymbol(symbol) || symbol.toUpperCase();
  const cached = await getCachedPrice(normalized).catch(() => null);
  if (cached) return cached;

  // Try market aggregator first
  try {
    const result = await getAggregatedPrice(normalized);
    if (result?.data && result.data.price > 0) {
      await setCachedPrice(normalized, result.data).catch(() => {});
      return result.data;
    }
  } catch {}

  // Try forex aggregator for forex/metals
  if (isForex(normalized) || isMetal(normalized)) {
    try {
      const forexAgg = getForexAggregator();
      if (forexAgg) {
        const { rows } = await forexAgg.getForexAndMetals();
        const row = rows.find(r => r.symbol === normalized);
        if (row?.price) {
          const result = { symbol: normalized, price: row.price, change24h: row.change24h, timestamp: Date.now(), provider: 'forex-aggregator' };
          await setCachedPrice(normalized, result).catch(() => {});
          return result;
        }
      }
    } catch {}
  }

  // Synthetic
  return {
    symbol: normalized,
    price: isMetal(normalized) ? (normalized === 'XAUUSD' ? 3300 : 30) :
           isForex(normalized) ? (normalized === 'EURUSD' ? 1.0850 : normalized === 'GBPUSD' ? 1.27 : normalized === 'USDJPY' ? 149.5 : normalized === 'AUDUSD' ? 0.65 : 0.90) : 100,
    change24h: 0, timestamp: Date.now(), provider: 'synthetic',
  };
}

async function getCandles(symbol, interval = '1h', limit = 300) {
  const normalized = (normalizeSymbol(symbol) || symbol).toUpperCase();
  const cached = await getCachedCandles(normalized, interval).catch(() => null);
  if (cached && Array.isArray(cached) && cached.length > 0) return validateCandles(cached);

  let candles = [];

  if (isCrypto(normalized)) {
    try {
      const result = await getAggregatedCandles(normalized, interval, limit);
      if (result?.data?.length > 0) candles = result.data;
    } catch (err) {
      console.warn(`[market.service] aggregator candles failed for ${normalized}/${interval}: ${err.message}`);
    }
  }

  if (candles.length === 0) {
    if (isMetal(normalized)) candles = generateMetalSynthetic(normalized, interval, limit);
    else if (isForex(normalized)) candles = generateForexSynthetic(normalized, interval, limit);
    else candles = generateCryptoSynthetic(normalized, interval, limit);
  }

  const valid = validateCandles(candles);
  await setCachedCandles(normalized, interval, valid).catch(() => {});
  return valid;
}

async function getMarkets() {
  const cached = await getCachedMarkets().catch(() => null);
  if (cached && Array.isArray(cached) && cached.length > 0) return cached;
  try {
    const result = await getAggregatedMarkets();
    if (result?.data?.length > 0) { await setCachedMarkets(result.data).catch(() => {}); return result.data; }
  } catch {}
  return [];
}

async function searchAssets(query) {
  const markets = await getMarkets().catch(() => []);
  const q = query.toLowerCase();
  return markets.filter(m => m.symbol?.toLowerCase().includes(q) || m.name?.toLowerCase().includes(q));
}

async function getHealth() { return getProviderHealth(); }

module.exports = { getPrice, getCandles, getMarkets, searchAssets, getHealth };