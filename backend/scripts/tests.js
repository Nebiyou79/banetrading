// tests/testProviders.js
// ── COMPREHENSIVE PROVIDER CAPABILITY TEST ──
// Tests every provider for: price, candles, markets, network reachability
// Run: node tests/testProviders.js

const TEST_SYMBOLS = {
  crypto: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  forex:  ['EURUSD', 'GBPUSD'],
  metals: ['XAUUSD', 'XAGUSD'],
};

const TEST_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

// Load all providers (skip if file missing)
function loadProvider(path, name) {
  try {
    return require(path);
  } catch (e) {
    console.log(`  ⚠️  ${name}: File not found (${path})`);
    return null;
  }
}

const providers = {
  // Crypto providers
  CryptoCompare: loadProvider('../services/market/providers/cryptocompare.provider', 'CryptoCompare'),
  CoinGecko:     loadProvider('../services/market/providers/coingecko.provider', 'CoinGecko'),
  KuCoin:        loadProvider('../services/market/providers/kucoin.provider', 'KuCoin'),
  Coinbase:      loadProvider('../services/market/providers/coinbase.provider', 'Coinbase'),
  CoinPaprika:   loadProvider('../services/market/providers/coinpaprika.provider', 'CoinPaprika'),
  CoinCap:       loadProvider('../services/market/providers/coincap.provider', 'CoinCap'),
  GateIo:        loadProvider('../services/market/providers/gateio.provider', 'GateIo'),
  Binance:       loadProvider('../services/market/providers/binance.provider', 'Binance'),
  Kraken:        loadProvider('../services/market/providers/kraken.provider', 'Kraken'),
  Bybit:         loadProvider('../services/market/providers/bybit.provider', 'Bybit'),
  OKX:           loadProvider('../services/market/providers/okx.provider', 'OKX'),

  // Forex/Metals providers
  TwelveData:      loadProvider('../services/market/providers/twelvedata.provider', 'TwelveData'),
  ExchangeRateHost: loadProvider('../services/market/providers/exchangeratehost.provider', 'ExchangeRateHost'),
  Frankfurter:     loadProvider('../services/market/providers/frankfurter.provider', 'Frankfurter'),
  ExchangeRateApi: loadProvider('../services/market/providers/exchangerateapi.provider', 'ExchangeRateApi'),
};

// ── Test helpers ──
const results = {};

async function testPrice(providerName, symbol, instance) {
  const start = Date.now();
  try {
    const result = await instance.getPrice(symbol);
    const latency = Date.now() - start;
    return {
      pass: true,
      latency,
      price: result?.price ?? null,
      change24h: result?.change24h ?? null,
      high24h: result?.high24h ?? null,
      low24h: result?.low24h ?? null,
    };
  } catch (e) {
    return { pass: false, latency: Date.now() - start, error: e.message.substring(0, 100) };
  }
}

async function testCandles(providerName, symbol, interval, instance) {
  const start = Date.now();
  try {
    const result = await instance.getCandles(symbol, interval, 10);
    const latency = Date.now() - start;
    const count = Array.isArray(result) ? result.length : 0;
    // Check first candle for validity
    const firstValid = count > 0 && result[0].time > 0 && result[0].open > 0;
    return { pass: count > 0 && firstValid, latency, count, firstValid };
  } catch (e) {
    return { pass: false, latency: Date.now() - start, error: e.message.substring(0, 100) };
  }
}

async function testMarkets(providerName, instance) {
  const start = Date.now();
  try {
    const result = await instance.getMarkets();
    const latency = Date.now() - start;
    const count = Array.isArray(result) ? result.length : 0;
    return { pass: count > 0, latency, count };
  } catch (e) {
    return { pass: false, latency: Date.now() - start, error: e.message.substring(0, 100) };
  }
}

// ── Create provider instances from class exports ──
function createInstance(providerModule) {
  if (!providerModule) return null;
  // Try different export patterns
  const keys = Object.keys(providerModule);
  for (const key of keys) {
    if (typeof providerModule[key] === 'function' && key.includes('Provider')) {
      try {
        return new providerModule[key]();
      } catch {}
    }
    if (providerModule[key]?.prototype?.fetchPrice) {
      try {
        return new providerModule[key]();
      } catch {}
    }
  }
  return null;
}

// ── Main test runner ──
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PROVIDER CAPABILITY TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [name, module] of Object.entries(providers)) {
    if (!module) continue;

    const instance = createInstance(module);
    if (!instance) {
      console.log(`  ⚠️  ${name}: Could not create provider instance`);
      continue;
    }

    console.log(`\n📦 ${name}`);
    console.log('─────────────────────────────────────────────────────');

    // Test 1: Price (BTCUSDT or first crypto)
    console.log('  💰 Price (BTCUSDT):');
    const priceResult = await testPrice(name, 'BTCUSDT', instance);
    if (priceResult.pass) {
      console.log(`    ✅ ${priceResult.latency}ms | Price: ${priceResult.price?.toFixed(2) || 'N/A'} | 24h: ${priceResult.change24h?.toFixed(2) || 'N/A'}%`);
    } else {
      console.log(`    ❌ ${priceResult.latency}ms | ${priceResult.error}`);
    }

    // Test 2: Candles (1h)
    console.log('  📊 Candles (1h, limit 10):');
    const candleResult = await testCandles(name, 'BTCUSDT', '1h', instance);
    if (candleResult.pass) {
      console.log(`    ✅ ${candleResult.latency}ms | ${candleResult.count} candles | Valid: ${candleResult.firstValid}`);
    } else {
      console.log(`    ❌ ${candleResult.latency}ms | ${candleResult.error || 'Empty result'}`);
    }

    // Test 3: Candles (1m)
    console.log('  📊 Candles (1m, limit 10):');
    const candle1m = await testCandles(name, 'BTCUSDT', '1m', instance);
    if (candle1m.pass) {
      console.log(`    ✅ ${candle1m.latency}ms | ${candle1m.count} candles`);
    } else {
      console.log(`    ❌ ${candle1m.latency}ms | ${candle1m.error || 'Not supported'}`);
    }

    // Test 4: Markets
    console.log('  📋 Markets:');
    const marketResult = await testMarkets(name, instance);
    if (marketResult.pass) {
      console.log(`    ✅ ${marketResult.latency}ms | ${marketResult.count} assets`);
    } else {
      console.log(`    ❌ ${marketResult.latency}ms | ${marketResult.error || 'Not supported'}`);
    }

    // Test forex if provider supports it (try EURUSD)
    if (['ExchangeRateHost', 'Frankfurter', 'ExchangeRateApi', 'TwelveData'].includes(name)) {
      console.log('  💱 Forex Price (EURUSD):');
      const forexResult = await testPrice(name, 'EURUSD', instance);
      if (forexResult.pass) {
        console.log(`    ✅ ${forexResult.latency}ms | Price: ${forexResult.price}`);
      } else {
        console.log(`    ❌ ${forexResult.latency}ms | ${forexResult.error}`);
      }
    }

    results[name] = {
      price: priceResult.pass,
      candles1h: candleResult.pass,
      candles1m: candle1m.pass,
      markets: marketResult.pass,
    };
  }

  // ── Summary ──
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Provider           | Price | Candles(1h) | Candles(1m) | Markets');
  console.log('───────────────────|───────|─────────────|─────────────|────────');
  for (const [name, r] of Object.entries(results)) {
    const pad = name.padEnd(18);
    const price = r.price ? '✅' : '❌';
    const c1h = r.candles1h ? '✅' : '❌';
    const c1m = r.candles1m ? '✅' : '❌';
    const markets = r.markets ? '✅' : '❌';
    console.log(`${pad} | ${price}    | ${c1h}           | ${c1m}           | ${markets}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  PROVIDER CAPABILITIES REFERENCE');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('CryptoCompare  | Price:✅ Candles:✅ Markets:✅ | Free, no key, 100k/mo');
  console.log('CoinGecko      | Price:✅ Candles:✅ Markets:✅ | Free, no key, 30/min (rate-limited)');
  console.log('KuCoin         | Price:✅ Candles:✅ Markets:✅ | Free, no key, 100/10s');
  console.log('Coinbase       | Price:✅ Candles:❌ Markets:⚠️ | Free, no key, 10/s (price only)');
  console.log('CoinPaprika    | Price:✅ Candles:❌ Markets:✅ | Free, no key, 25k/mo');
  console.log('CoinCap        | Price:✅ Candles:✅ Markets:✅ | Free, no key, 200/min');
  console.log('GateIo         | Price:✅ Candles:✅ Markets:✅ | Free, no key, 200/s');
  console.log('Binance        | Price:✅ Candles:✅ Markets:✅ | Free, no key, 1200/min (BLOCKED on your network)');
  console.log('Kraken         | Price:✅ Candles:✅ Markets:✅ | Free, no key, 60/min (BLOCKED on your network)');
  console.log('Bybit          | Price:✅ Candles:✅ Markets:✅ | Free, no key, 50/s (BLOCKED on your network)');
  console.log('OKX            | Price:✅ Candles:✅ Markets:✅ | Free, no key, 20/2s (BLOCKED on your network)');
  console.log('TwelveData     | Price:✅ Candles:✅ Forex:✅   | API key needed, 8/min free');
  console.log('ExchangeRateHost| Price:✅ Forex:✅            | API key needed');
  console.log('Frankfurter    | Price:✅ Candles:1d/1w        | Free, no key, forex only');
  console.log('ExchangeRateApi| Price:✅ Forex:✅            | Free, no key, forex only');

  console.log('\n✅ = Working on your network');
  console.log('❌ = Blocked or not supported');
  console.log('⚠️  = Partial support\n');
}

runTests().catch(console.error);