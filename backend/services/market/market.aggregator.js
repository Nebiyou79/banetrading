// services/market/market.aggregator.js
// ── MARKET AGGREGATOR ──
// Crypto providers: CryptoCompare, KuCoin, Huobi, Bitfinex, GateIo, CoinGecko, CoinPaprika, Coinbase
// Forex providers:  ExchangeRateApi, Frankfurter, TwelveData
// REMOVED: Binance, Bybit, Kraken, OKX, CoinCap (all blocked on this network)

const { CryptoCompareProvider } = require('./providers/cryptocompare.provider');
const { KuCoinProvider }        = require('./providers/kucoin.provider');
const { HuobiProvider }         = require('./providers/huobi.provider');
const { BitfinexProvider }      = require('./providers/bitfinex.provider');
const { GateIoProvider }        = require('./providers/gateio.provider');
const { CoinGeckoProvider }     = require('./providers/coingecko.provider');
const { CoinPaprikaProvider }   = require('./providers/coinpaprika.provider');
const { CoinbaseProvider }      = require('./providers/coinbase.provider');
const { ExchangeRateApiProvider } = require('./providers/exchangerateapi.provider');
const { FrankfurterProvider }   = require('./providers/frankfurter.provider');
const { TwelveDataProvider }    = require('./providers/twelvedata.provider');

// ── Provider instances ──
const cryptoProviders = [
  new CryptoCompareProvider(),
  new KuCoinProvider(),
  new HuobiProvider(),
  new BitfinexProvider(),
  new GateIoProvider(),
  new CoinGeckoProvider(),
  new CoinPaprikaProvider(),
  new CoinbaseProvider(),
];

const forexProviders = [
  new ExchangeRateApiProvider(),
  new FrankfurterProvider(),
  new TwelveDataProvider(),
];

// ── Failure tracking (4 = blacklist provider for this session) ──
const MAX_FAILURES = 4;

// Helper: check if error is just "symbol not supported" (not a real failure)
function isNotSupportedError(err) {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('no mapping') || msg.includes('not supported') || msg.includes('does not support');
}

const providerFailures = new Map();

// ── Auto-reset failure counts every 5 minutes ──
// Prevents permanent blacklisting from temporary network issues
setInterval(() => {
  if (providerFailures.size > 0) {
    console.log('[Aggregator] Resetting provider failure counts');
    providerFailures.clear();
  }
}, 5 * 60 * 1000);

// ── Auto-reset failure counts every 5 minutes ──
// Prevents permanent blacklisting from temporary network issues
setInterval(() => {
  if (providerFailures.size > 0) {
    console.log('[Aggregator] Resetting provider failure counts');
    providerFailures.clear();
  }
}, 5 * 60 * 1000);

function recordFailure(name) {
  const count = (providerFailures.get(name) || 0) + 1;
  providerFailures.set(name, count);
  if (count >= MAX_FAILURES) {
    console.warn(`[Aggregator] Provider ${name} reached ${MAX_FAILURES} failures — skipping for session`);
  }
  return count;
}

function isSkipped(name) {
  return (providerFailures.get(name) || 0) >= MAX_FAILURES;
}

// ── COIN_IMAGES fallback map (CoinGecko CDN) ──
const COIN_IMAGES = {
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP:  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA:  'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  TRX:  'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  MATIC:'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  DOT:  'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LTC:  'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  BCH:  'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
  UNI:  'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  ETC:  'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png',
};

function getImageUrl(symbol) {
  const bare = symbol.replace('USDT', '').replace('USDT', '');
  return COIN_IMAGES[bare] || null;
}

// ── Fetch markets from cascade ──
async function getAggregatedMarkets() {
  for (const provider of cryptoProviders) {
    if (isSkipped(provider.name)) continue;
    try {
      const markets = await provider.getMarkets();
      if (markets && markets.length >= 5) {
        // Inject images from COIN_IMAGES map if provider doesn't supply them
        const withImages = markets.map(m => ({
          ...m,
          image: m.image || getImageUrl(m.symbol),
        }));
        return { data: withImages, provider: provider.name };
      }
    } catch (err) {
      const fails = isNotSupportedError(err) ? (providerFailures.get(provider.name) || 0) : recordFailure(provider.name);
        if (!err.message?.includes('aborted') && !isNotSupportedError(err)) {
        console.warn(`[Aggregator] ${provider.name} markets failed (${fails}/${MAX_FAILURES}): ${err.message}`);
      }
    }
  }

  console.warn('[Aggregator] All crypto providers failed for markets');
  return { data: [], provider: 'none' };
}

// ── Fetch price from cascade ──
async function getAggregatedPrice(symbol) {
  for (const provider of cryptoProviders) {
    if (isSkipped(provider.name)) continue;
    try {
      const price = await provider.getPrice(symbol);
      if (price?.price > 0) {
        return { ...price, provider: provider.name };
      }
    } catch (err) {
      const fails = isNotSupportedError(err) ? (providerFailures.get(provider.name) || 0) : recordFailure(provider.name);
        if (!err.message?.includes('aborted') && !isNotSupportedError(err)) {
        console.warn(`[Aggregator] ${provider.name} price(${symbol}) failed (${fails}/${MAX_FAILURES}): ${err.message}`);
      }
    }
  }

  console.warn(`[Aggregator] All providers failed for price: ${symbol}`);
  return null;
}

// ── Fetch candles from cascade ──
async function getAggregatedCandles(symbol, interval, limit) {
  // For forex/metals, use forex providers
  const isFx = symbol.length === 6 && !symbol.endsWith('USDT');
  const isMetal = symbol.startsWith('XA');

  if (isFx || isMetal) {
    return getForexCandles(symbol, interval, limit);
  }

  for (const provider of cryptoProviders) {
    if (isSkipped(provider.name)) continue;
    // Not all providers support candles — skip those that don't
    if (typeof provider.fetchCandles !== 'function') continue;
    try {
      const candles = await provider.getCandles(symbol, interval, limit);
      if (candles && candles.length >= 5) {
        return { data: candles, provider: provider.name };
      }
    } catch (err) {
      const fails = isNotSupportedError(err) ? (providerFailures.get(provider.name) || 0) : recordFailure(provider.name);
        if (!err.message?.includes('aborted') && !isNotSupportedError(err)) {
        console.warn(`[Aggregator] ${provider.name} candles(${symbol}/${interval}) failed (${fails}/${MAX_FAILURES}): ${err.message}`);
      }
    }
  }

  console.warn(`[Aggregator] All providers failed for candles: ${symbol}/${interval}`);
  return { data: [], provider: 'none' };
}

// ── Forex candles cascade ──
async function getForexCandles(symbol, interval, limit) {
  for (const provider of forexProviders) {
    if (isSkipped(provider.name)) continue;
    if (typeof provider.fetchCandles !== 'function') continue;
    try {
      const candles = await provider.getCandles(symbol, interval, limit);
      if (candles && candles.length >= 5) {
        return { data: candles, provider: provider.name };
      }
    } catch (err) {
      const fails = isNotSupportedError(err) ? (providerFailures.get(provider.name) || 0) : recordFailure(provider.name);
        if (!err.message?.includes('aborted') && !isNotSupportedError(err)) {
        console.warn(`[Aggregator] ${provider.name} fx-candles(${symbol}/${interval}) failed (${fails}/${MAX_FAILURES}): ${err.message}`);
      }
    }
  }
  return { data: [], provider: 'none' };
}

// ── Health check ──
function getProviderHealth() {
  return [...cryptoProviders, ...forexProviders].map(p => ({
    name:     p.name,
    failures: providerFailures.get(p.name) || 0,
    skipped:  isSkipped(p.name),
    health:   p.getHealth ? p.getHealth() : { name: p.name },
  }));
}

module.exports = {
  getAggregatedMarkets,
  getAggregatedPrice,
  getAggregatedCandles,
  getProviderHealth,
  COIN_IMAGES,
};