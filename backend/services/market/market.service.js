// src/services/market/market.service.js
// ── PUBLIC API FACADE ──

const {
  getAggregatedPrice,
  getAggregatedCandles,
  getAggregatedMarkets,
  getProviderHealth,
} = require('./market.aggregator');
const {
  getCachedPrice,
  setCachedPrice,
  getCachedCandles,
  setCachedCandles,
  getCachedMarkets,
  setCachedMarkets,
} = require('./cache/market.cache');
const { normalizeSymbol } = require('./symbols/symbol.map');

async function getPrice(symbol) {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) throw new Error(`Unknown symbol: ${symbol}`);
  
  // Check cache first
  const cached = await getCachedPrice(normalized);
  if (cached) return cached;
  
  // Fetch with aggregation
  const result = await getAggregatedPrice(normalized);
  if (!result.data) throw new Error(`No price data for ${normalized}`);
  
  // Cache the result
  await setCachedPrice(normalized, result.data);
  
  return result.data;
}

async function getCandles(symbol, interval = '1h', limit = 500) {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) throw new Error(`Unknown symbol: ${symbol}`);
  
  // Check cache first
  const cached = await getCachedCandles(normalized, interval);
  if (cached) return cached;
  
  // Fetch with aggregation
  const result = await getAggregatedCandles(normalized, interval, limit);
  if (!result.data) throw new Error(`No candle data for ${normalized}`);
  
  // Cache the result
  await setCachedCandles(normalized, interval, result.data);
  
  return result.data;
}

async function getMarkets() {
  // Check cache first
  const cached = await getCachedMarkets();
  if (cached) return cached;
  
  // Fetch
  const result = await getAggregatedMarkets();
  if (!result.data || result.data.length === 0) {
    throw new Error('No market data available');
  }
  
  // Cache
  await setCachedMarkets(result.data);
  
  return result.data;
}

async function searchAssets(query) {
  const markets = await getMarkets();
  const q = query.toLowerCase();
  return markets.filter(m =>
    m.symbol.toLowerCase().includes(q) ||
    m.name.toLowerCase().includes(q)
  );
}

async function getHealth() {
  return getProviderHealth();
}

module.exports = {
  getPrice,
  getCandles,
  getMarkets,
  searchAssets,
  getHealth,
};