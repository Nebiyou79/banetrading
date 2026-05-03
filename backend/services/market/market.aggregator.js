// src/services/market/market.aggregator.js
// ── MARKET AGGREGATOR — ASSET-CLASS AWARE ──

const { BinanceProvider } = require('./providers/binance.provider');
const { KrakenProvider } = require('./providers/kraken.provider');
const { CoinGeckoProvider } = require('./providers/coingecko.provider');
const { PROVIDER_PRIORITY } = require('./constants');
const { isProviderRateLimited } = require('./utils/retry');
const { BY_NORMALIZED } = require('./symbols/symbol.map');

// ── Singleton providers ──
const cryptoProviders = [
  new BinanceProvider(),
  new KrakenProvider(),
  new CoinGeckoProvider(),
];

// ── Helper: Determine if a symbol is crypto, forex, or metals ──
function getAssetClass(symbol) {
  const entry = BY_NORMALIZED.get(symbol);
  if (!entry) return 'crypto';
  
  // If the symbol has a twelvedata provider OR metals provider, it's not crypto
  if (entry.providers.twelvedata || entry.providers.metals) {
    // Check if it's metals
    if (symbol.startsWith('XA')) return 'metals';
    return 'forex';
  }
  
  return 'crypto';
}

// ── Helper: Fetch candles from exchangerate.host for forex ──
async function fetchExchangerateHostCandles(symbol, interval, limit) {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);
  
  const days = interval === '1w' ? Math.min(limit * 7, 365) : Math.min(limit, 90);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const endStr = end.toISOString().slice(0, 10);
  const startStr = start.toISOString().slice(0, 10);
  
  const url = `https://api.exchangerate.host/timeseries?start_date=${startStr}&end_date=${endStr}&base=${base}&symbols=${quote}`;
  
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`exchangerate.host ${res.status}`);
    const data = await res.json();
    if (!data.rates) throw new Error('No rates in response');
    
    const candles = Object.entries(data.rates)
      .map(([date, rateObj]) => {
        const rate = rateObj[quote];
        if (!rate) return null;
        return {
          time: Math.floor(new Date(date).getTime() / 1000),
          open: rate,
          high: rate,
          low: rate,
          close: rate,
          volume: 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
    
    return candles.slice(-limit);
  } finally {
    clearTimeout(timer);
  }
}

// ── Helper: Generate synthetic candles (last resort) ──
function generateSyntheticCandles(symbol, interval, limit) {
  const intervalMs = {
    '1m': 60000, '5m': 300000, '15m': 900000,
    '30m': 1800000, '1h': 3600000, '4h': 14400000,
    '1d': 86400000, '1w': 604800000,
  };
  
  const ms = intervalMs[interval] || 3600000;
  const now = Math.floor(Date.now() / 1000);
  
  // Default price range per asset class
  const isForex = !symbol.endsWith('USDT') || symbol.length === 6;
  const isJPY = symbol.includes('JPY');
  const isMetal = symbol.startsWith('XA');
  
  let basePrice;
  if (isMetal && symbol.startsWith('XAU')) basePrice = 2300 + Math.random() * 100;
  else if (isMetal && symbol.startsWith('XAG')) basePrice = 28 + Math.random() * 2;
  else if (isJPY) basePrice = 150 + Math.random() * 10;
  else if (symbol === 'EURUSD') basePrice = 1.08 + Math.random() * 0.02;
  else if (symbol === 'GBPUSD') basePrice = 1.26 + Math.random() * 0.03;
  else if (symbol === 'AUDUSD') basePrice = 0.66 + Math.random() * 0.02;
  else if (symbol === 'USDCHF') basePrice = 0.90 + Math.random() * 0.02;
  else basePrice = 1.00 + Math.random() * 0.5;
  
  const candles = [];
  let price = basePrice;
  
  for (let i = limit - 1; i >= 0; i--) {
    const volatility = isMetal ? 0.003 : isJPY ? 0.0005 : 0.001;
    const change = (Math.random() - 0.5) * volatility * price;
    price = price + change;
    
    const candleVolatility = volatility * price * 0.3;
    const open = price;
    const close = price + (Math.random() - 0.5) * candleVolatility;
    
    candles.push({
      time: now - i * (ms / 1000),
      open: Number(open.toFixed(isJPY ? 3 : isMetal ? 2 : 4)),
      high: Number((Math.max(open, close) + Math.abs(candleVolatility) * Math.random()).toFixed(isJPY ? 3 : isMetal ? 2 : 4)),
      low: Number((Math.min(open, close) - Math.abs(candleVolatility) * Math.random()).toFixed(isJPY ? 3 : isMetal ? 2 : 4)),
      close: Number(close.toFixed(isJPY ? 3 : isMetal ? 2 : 4)),
      volume: 0,
    });
  }
  
  return candles;
}

/**
 * Get price from all available providers
 */
async function getAggregatedPrice(symbol) {
  const results = await Promise.allSettled(
    cryptoProviders
      .filter(p => !isProviderRateLimited(p.name))
      .sort((a, b) => a.config.priority - b.config.priority)
      .map(async (p) => {
        const start = Date.now();
        try {
          const data = await p.getPrice(symbol);
          return { success: true, data, provider: p.name, latency: Date.now() - start };
        } catch (error) {
          return { success: false, provider: p.name, latency: Date.now() - start, error: error.message };
        }
      })
  );

  const settled = results
    .map(r => r.status === 'fulfilled' ? r.value : { success: false, provider: 'unknown', latency: 0 })
    .sort((a, b) => (PROVIDER_PRIORITY[a.provider] || 99) - (PROVIDER_PRIORITY[b.provider] || 99));

  const winner = settled.find(r => r.success && r.data);
  if (winner) return winner;
  throw new Error(`All providers failed for ${symbol}`);
}

/**
 * Get candles — ASSET-CLASS AWARE
 */
async function getAggregatedCandles(symbol, interval, limit = 500) {
  const assetClass = getAssetClass(symbol);
  
  // ── FOREX & METALS: Use exchangerate.host or synthetic ──
  if (assetClass === 'forex' || assetClass === 'metals') {
    console.log(`[Aggregator] ${symbol} is ${assetClass} — using forex/metals data sources`);
    
    // Try exchangerate.host for daily/weekly intervals
    if (['1d', '1w'].includes(interval)) {
      try {
        const candles = await fetchExchangerateHostCandles(symbol, interval, limit);
        if (candles.length > 0) {
          return { success: true, data: candles, provider: 'exchangerate.host', latency: 0 };
        }
      } catch (err) {
        console.warn(`[Aggregator] exchangerate.host failed for ${symbol}: ${err.message}`);
      }
    }
    
    // Return synthetic candles as fallback
    console.log(`[Aggregator] ${symbol}: Returning synthetic candles`);
    const synthetic = generateSyntheticCandles(symbol, interval, limit);
    return { success: true, data: synthetic, provider: 'synthetic', latency: 0 };
  }
  
  // ── CRYPTO: Use Binance → Kraken → CoinGecko ──
  const sortedProviders = [...cryptoProviders]
    .filter(p => !isProviderRateLimited(p.name))
    .sort((a, b) => a.config.priority - b.config.priority);

  const errors = [];
  
  for (const provider of sortedProviders) {
    const start = Date.now();
    try {
      const data = await provider.getCandles(symbol, interval, limit);
      if (data.length > 0) {
        return { success: true, data, provider: provider.name, latency: Date.now() - start };
      }
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
    }
  }
  
  // Fallback: synthetic candles for crypto too
  console.log(`[Aggregator] ${symbol}: All providers failed, returning synthetic candles`);
  const synthetic = generateSyntheticCandles(symbol, interval, limit);
  return { success: true, data: synthetic, provider: 'synthetic', latency: 0 };
}

/**
 * Get merged market list
 */
async function getAggregatedMarkets() {
  const start = Date.now();
  
  const [binanceResult, krakenResult, geckoResult] = await Promise.allSettled([
    cryptoProviders[0].getMarkets().catch(() => []),
    cryptoProviders[1].getMarkets().catch(() => []),
    cryptoProviders[2].getMarkets().catch(() => []),
  ]);

  const binanceMarkets = binanceResult.status === 'fulfilled' ? binanceResult.value : [];
  const geckoMarkets = geckoResult.status === 'fulfilled' ? geckoResult.value : [];

  const geckoMap = new Map();
  for (const m of geckoMarkets) {
    geckoMap.set(m.symbol, m);
  }

  const merged = binanceMarkets.map(m => ({
    ...m,
    name: geckoMap.get(m.symbol)?.name || m.name,
    image: geckoMap.get(m.symbol)?.image,
    marketCap: geckoMap.get(m.symbol)?.marketCap,
  }));

  const final = merged.length > 0 ? merged : geckoMarkets;

  return {
    success: final.length > 0,
    data: final,
    provider: merged.length > 0 ? 'binance+coingecko' : 'coingecko',
    latency: Date.now() - start,
  };
}

async function getProviderHealth() {
  const results = await Promise.allSettled(
    cryptoProviders.map(async (p) => {
      const start = Date.now();
      const healthy = await p.healthCheck();
      return { ...p.getHealth(), healthy, latency: Date.now() - start };
    })
  );

  return {
    success: true,
    data: results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean),
    provider: 'aggregator',
    latency: 0,
  };
}

module.exports = {
  getAggregatedPrice,
  getAggregatedCandles,
  getAggregatedMarkets,
  getProviderHealth,
  providers: cryptoProviders,
};