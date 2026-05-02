// src/services/market/cache/market.cache.js
// ── MARKET CACHE WRAPPER ──

const { getRedisClient } = require('./redis.client');
const { CACHE_TTL } = require('../constants');

function redis() {
  return getRedisClient();
}

// ── Key builders ──
const keys = {
  price:   (symbol) => `market:price:${symbol.toUpperCase()}`,
  ticker:  (symbol) => `market:ticker:${symbol.toUpperCase()}`,
  candles: (symbol, interval) => `market:candles:${symbol.toUpperCase()}:${interval}`,
  markets: () => 'market:list',
  health:  (provider) => `market:health:${provider}`,
};

// ── Price ──
async function getCachedPrice(symbol) {
  try {
    const val = await redis().get(keys.price(symbol));
    if (val && (Date.now() - val.timestamp) > CACHE_TTL.PRICE * 1000) return null;
    return val;
  } catch { return null; }
}

async function setCachedPrice(symbol, price) {
  try {
    await redis().set(keys.price(symbol), price, { ex: CACHE_TTL.PRICE });
  } catch { /* non-fatal */ }
}

// ── Ticker ──
async function getCachedTicker(symbol) {
  try {
    return await redis().get(keys.ticker(symbol));
  } catch { return null; }
}

async function setCachedTicker(symbol, ticker) {
  try {
    await redis().set(keys.ticker(symbol), ticker, { ex: CACHE_TTL.PRICE });
  } catch { /* non-fatal */ }
}

// ── Candles ──
async function getCachedCandles(symbol, interval) {
  try {
    return await redis().get(keys.candles(symbol, interval));
  } catch { return null; }
}

async function setCachedCandles(symbol, interval, candles) {
  try {
    await redis().set(keys.candles(symbol, interval), candles, { ex: CACHE_TTL.CANDLES });
  } catch { /* non-fatal */ }
}

// ── Markets ──
async function getCachedMarkets() {
  try {
    return await redis().get(keys.markets());
  } catch { return null; }
}

async function setCachedMarkets(markets) {
  try {
    await redis().set(keys.markets(), markets, { ex: CACHE_TTL.MARKETS });
  } catch { /* non-fatal */ }
}

// ── Health ──
async function setProviderHealth(provider, healthy) {
  try {
    await redis().set(keys.health(provider), healthy ? '1' : '0', { ex: CACHE_TTL.HEALTH });
  } catch { /* non-fatal */ }
}

async function getProviderHealth(provider) {
  try {
    const val = await redis().get(keys.health(provider));
    return val !== '0';
  } catch { return true; }
}

// ── Invalidation ──
async function invalidateSymbol(symbol) {
  try {
    await redis().del(keys.price(symbol), keys.ticker(symbol));
  } catch { /* non-fatal */ }
}

module.exports = {
  getCachedPrice,
  setCachedPrice,
  getCachedTicker,
  setCachedTicker,
  getCachedCandles,
  setCachedCandles,
  getCachedMarkets,
  setCachedMarkets,
  setProviderHealth,
  getProviderHealth,
  invalidateSymbol,
};