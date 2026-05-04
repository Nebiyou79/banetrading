// services/market/market.aggregator.js
// ── MARKET AGGREGATOR — CRYPTO + FOREX + METALS ──

// ── Crypto providers ──
const { CoinGeckoProvider } = require('./providers/coingecko.provider');
const { CoinCapProvider } = require('./providers/coincap.provider');
const { CoinPaprikaProvider } = require('./providers/coinpaprika.provider');
const { GateIoProvider } = require('./providers/gateio.provider');
const { KuCoinProvider } = require('./providers/kucoin.provider');
const { CoinbaseProvider } = require('./providers/coinbase.provider');
const { CryptoCompareProvider } = require('./providers/cryptocompare.provider');

// ── Forex/Metals providers ──
const { TwelveDataProvider } = require('./providers/twelvedata.provider');
const { ExchangeRateHostProvider } = require('./providers/exchangeratehost.provider');
const { FrankfurterProvider } = require('./providers/frankfurter.provider');
const { ExchangeRateApiProvider } = require('./providers/exchangerateapi.provider');

const { isProviderRateLimited } = require('./utils/retry');

// ── 7 crypto providers ──
const cryptoProviders = [
  new CoinGeckoProvider(),
  new CoinCapProvider(),
  new GateIoProvider(),
  new KuCoinProvider(),
  new CoinbaseProvider(),
  new CryptoCompareProvider(),
  new CoinPaprikaProvider(),
];

// ── 4 forex/metals providers ──
const forexProviders = [
  new TwelveDataProvider(),
  new ExchangeRateHostProvider(),
  new FrankfurterProvider(),
  new ExchangeRateApiProvider(),
];

const unreachable = new Map();

function isUnreachable(name) {
  const t = unreachable.get(name);
  if (!t) return false;
  if (Date.now() - t > 60000) { unreachable.delete(name); return false; }
  return true;
}
function markUnreachable(name) { unreachable.set(name, Date.now()); }

function isForexOrMetals(symbol) {
  return ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'XAUUSD', 'XAGUSD'].includes(symbol);
}

async function getAggregatedPrice(symbol) {
  const providers = isForexOrMetals(symbol) ? forexProviders : cryptoProviders;
  const available = providers.filter(p => !isProviderRateLimited(p.name) && !isUnreachable(p.name));
  const errors = [];

  for (const p of available) {
    try {
      const data = await p.getPrice(symbol);
      if (data && data.price > 0) return { success: true, data, provider: p.name };
    } catch (err) {
      errors.push(`${p.name}: ${err.message}`);
      if (err.message.includes('timeout') || err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
        markUnreachable(p.name);
      }
    }
  }
  throw new Error(`All providers failed for ${symbol}: ${errors.join(' | ')}`);
}

async function getAggregatedCandles(symbol, interval, limit = 500) {
  const providers = isForexOrMetals(symbol) ? forexProviders : cryptoProviders;
  const available = providers.filter(p => !isProviderRateLimited(p.name) && !isUnreachable(p.name));

  for (const p of available) {
    try {
      const data = await p.getCandles(symbol, interval, limit);
      if (data && data.length > 0) return { success: true, data, provider: p.name };
    } catch (err) {
      if (err.message.includes('timeout') || err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
        markUnreachable(p.name);
      }
    }
  }
  throw new Error(`All candle providers failed for ${symbol}/${interval}`);
}

async function getAggregatedMarkets() {
  const available = cryptoProviders.filter(p => !isUnreachable(p.name));
  
  for (const p of available) {
    try {
      const data = await p.getMarkets();
      if (data && data.length > 0) {
        try {
          const gecko = new CoinGeckoProvider();
          const geckoData = await gecko.getMarkets().catch(() => []);
          const geckoMap = new Map(geckoData.map(m => [m.symbol, m]));
          const merged = data.map(m => {
            const g = geckoMap.get(m.symbol);
            return g ? { ...m, image: g.image, marketCap: g.marketCap || m.marketCap } : m;
          });
          return { success: true, data: merged, provider: `${p.name}+coingecko` };
        } catch {
          return { success: true, data, provider: p.name };
        }
      }
    } catch {}
  }
  return { success: false, data: [], provider: 'none' };
}

async function getProviderHealth() {
  const allProviders = [...cryptoProviders, ...forexProviders];
  const results = await Promise.allSettled(
    allProviders.map(async p => {
      const start = Date.now();
      const healthy = await p.healthCheck().catch(() => false);
      return { ...p.getHealth(), healthy, latency: Date.now() - start };
    })
  );
  return { success: true, data: results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean) };
}

module.exports = { getAggregatedPrice, getAggregatedCandles, getAggregatedMarkets, getProviderHealth };