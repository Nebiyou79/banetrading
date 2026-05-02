// src/services/market/market.aggregator.js
// ── MARKET AGGREGATOR — PARALLEL FETCH + PRIORITY SELECTION + MERGE ──

const { BinanceProvider } = require('./providers/binance.provider');
const { KrakenProvider } = require('./providers/kraken.provider');
const { CoinGeckoProvider } = require('./providers/coingecko.provider');
const { PROVIDER_PRIORITY } = require('./constants');
const { isProviderRateLimited } = require('./utils/retry');

// ── Singleton providers ──
const providers = [
  new BinanceProvider(),
  new KrakenProvider(),
  new CoinGeckoProvider(),
];

/**
 * Main aggregator for price data.
 * Fetches from ALL providers in parallel using Promise.allSettled.
 * Returns the result from the highest-priority provider that succeeded.
 */
async function getAggregatedPrice(symbol) {
  const results = await Promise.allSettled(
    providers
      .filter(p => !isProviderRateLimited(p.name))
      .sort((a, b) => a.config.priority - b.config.priority)
      .map(async (p) => {
        const start = Date.now();
        try {
          const data = await p.getPrice(symbol);
          return {
            success: true,
            data,
            provider: p.name,
            latency: Date.now() - start,
          };
        } catch (error) {
          return {
            success: false,
            provider: p.name,
            latency: Date.now() - start,
            error: error.message,
          };
        }
      })
  );

  const settled = results
    .map(r => r.status === 'fulfilled' ? r.value : { success: false, provider: 'unknown', latency: 0 })
    .sort((a, b) => {
      const priA = PROVIDER_PRIORITY[a.provider] || 99;
      const priB = PROVIDER_PRIORITY[b.provider] || 99;
      return priA - priB;
    });

  const winner = settled.find(r => r.success && r.data);
  if (winner) return winner;

  throw new Error(`All providers failed for ${symbol}`);
}

/**
 * Get candles with priority fallback.
 */
async function getAggregatedCandles(symbol, interval, limit = 500) {
  const sortedProviders = [...providers]
    .filter(p => !isProviderRateLimited(p.name))
    .sort((a, b) => a.config.priority - b.config.priority);

  const errors = [];
  
  for (const provider of sortedProviders) {
    const start = Date.now();
    try {
      const data = await provider.getCandles(symbol, interval, limit);
      if (data.length > 0) {
        return {
          success: true,
          data,
          provider: provider.name,
          latency: Date.now() - start,
        };
      }
    } catch (error) {
      errors.push(`${provider.name}: ${error.message}`);
    }
  }

  throw new Error(`All providers failed for candles ${symbol}: ${errors.join('; ')}`);
}

/**
 * Get merged market list from all providers.
 */
async function getAggregatedMarkets() {
  const start = Date.now();
  
  const [binanceResult, krakenResult, geckoResult] = await Promise.allSettled([
    providers[0].getMarkets().catch(() => []),
    providers[1].getMarkets().catch(() => []),
    providers[2].getMarkets().catch(() => []),
  ]);

  const binanceMarkets = binanceResult.status === 'fulfilled' ? binanceResult.value : [];
  const geckoMarkets = geckoResult.status === 'fulfilled' ? geckoResult.value : [];

  // Build CoinGecko lookup for images
  const geckoMap = new Map();
  for (const m of geckoMarkets) {
    geckoMap.set(m.symbol, m);
  }

  // Merge: Binance prices + CoinGecko images/names
  const merged = binanceMarkets.map(m => {
    const gecko = geckoMap.get(m.symbol);
    return {
      ...m,
      name: gecko?.name || m.name,
      image: gecko?.image,
      marketCap: gecko?.marketCap,
    };
  });

  const final = merged.length > 0 ? merged : geckoMarkets;

  return {
    success: final.length > 0,
    data: final,
    provider: merged.length > 0 ? 'binance+coingecko' : 'coingecko',
    latency: Date.now() - start,
  };
}

/**
 * Get provider health status
 */
async function getProviderHealth() {
  const results = await Promise.allSettled(
    providers.map(async (p) => {
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
  providers,
};