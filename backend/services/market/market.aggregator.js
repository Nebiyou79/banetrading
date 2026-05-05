// services/market/market.aggregator.js
// ── MARKET AGGREGATOR — CRYPTO + FOREX + METALS ──
// FIXED:
//   - CoinGecko moved to LAST position (try cheaper providers first)
//   - TwelveData excluded from metals (XAUUSD/XAGUSD) — free tier doesn't support them
//   - All provider errors caught and logged

// ── Crypto providers (ordered cheapest/fastest first, CoinGecko last) ──
const { CoinCapProvider }       = require('./providers/coincap.provider');
const { CoinPaprikaProvider }   = require('./providers/coinpaprika.provider');
const { GateIoProvider }        = require('./providers/gateio.provider');
const { KuCoinProvider }        = require('./providers/kucoin.provider');
const { CoinbaseProvider }      = require('./providers/coinbase.provider');
const { CryptoCompareProvider } = require('./providers/cryptocompare.provider');
const { CoinGeckoProvider }     = require('./providers/coingecko.provider'); // ← LAST

// ── Forex/Metals providers ──
const { TwelveDataProvider }       = require('./providers/twelvedata.provider');
const { ExchangeRateHostProvider } = require('./providers/exchangeratehost.provider');
const { FrankfurterProvider }      = require('./providers/frankfurter.provider');
const { ExchangeRateApiProvider }  = require('./providers/exchangerateapi.provider');

const { isProviderRateLimited } = require('./utils/retry');

// ── Crypto: CoinGecko is LAST (rate-limited, expensive) ──
const cryptoProviders = [
  new CoinCapProvider(),       // priority 2 — free, fast
  new GateIoProvider(),        // priority 7 — free, fast
  new KuCoinProvider(),        // free
  new CoinbaseProvider(),      // free
  new CryptoCompareProvider(), // free
  new CoinPaprikaProvider(),   // free
  new CoinGeckoProvider(),     // LAST — 30 req/min free tier, rate-limited
];

// ── Forex providers — TwelveData first for forex (not metals!) ──
const forexProviders = [
  new TwelveDataProvider(),       // forex only (EURUSD etc.) — excludes metals
  new ExchangeRateHostProvider(),
  new FrankfurterProvider(),
  new ExchangeRateApiProvider(),
];

// ── Metals providers — NO TwelveData (premium required for XAU/XAG) ──
const metalsProviders = [
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

function isMetals(symbol) {
  return symbol.startsWith('XA'); // XAUUSD, XAGUSD
}

function isForex(symbol) {
  return ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD'].includes(symbol);
}

function getProviders(symbol) {
  if (isMetals(symbol)) return metalsProviders; // metals: never TwelveData
  if (isForex(symbol))  return forexProviders;  // forex: TwelveData OK
  return cryptoProviders;
}

async function getAggregatedPrice(symbol) {
  const providers = getProviders(symbol);
  const available = providers.filter(p => !isProviderRateLimited(p.name) && !isUnreachable(p.name));
  const errors    = [];

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
  const providers = getProviders(symbol);
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
  // Try each crypto provider in order (CoinGecko is last)
  const available = cryptoProviders.filter(p => !isUnreachable(p.name));

  for (const p of available) {
    try {
      const data = await p.getMarkets();
      if (data && data.length > 0) {
        // Optionally enrich with CoinGecko images (best-effort, not required)
        try {
          const gecko    = new CoinGeckoProvider();
          const geckoData = await gecko.getMarkets().catch(() => []);
          const geckoMap  = new Map(geckoData.map(m => [m.symbol, m]));
          const merged    = data.map(m => {
            const g = geckoMap.get(m.symbol);
            return g ? { ...m, image: g.image, marketCap: g.marketCap || m.marketCap } : m;
          });
          return { success: true, data: merged, provider: `${p.name}+coingecko` };
        } catch {
          return { success: true, data, provider: p.name };
        }
      }
    } catch { /* try next */ }
  }
  return { success: false, data: [], provider: 'none' };
}

async function getProviderHealth() {
  const allProviders = [...cryptoProviders, ...forexProviders];
  const results = await Promise.allSettled(
    allProviders.map(async p => {
      const start   = Date.now();
      const healthy = await p.healthCheck().catch(() => false);
      return { ...p.getHealth(), healthy, latency: Date.now() - start };
    })
  );
  return { success: true, data: results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean) };
}

module.exports = { getAggregatedPrice, getAggregatedCandles, getAggregatedMarkets, getProviderHealth };