// src/services/market/symbols/symbol.map.js
// ── UNIVERSAL SYMBOL MAPPING ──
// All symbols normalize to Binance format (e.g., "BTCUSDT")

const SYMBOL_REGISTRY = [
  {
    normalized: 'BTCUSDT',
    name: 'Bitcoin',
    providers: {
      binance: 'BTCUSDT',
      kraken: 'XXBTZUSD',
      coingecko: 'bitcoin',
      kucoin: 'BTC-USDT',
    },
  },
  {
    normalized: 'ETHUSDT',
    name: 'Ethereum',
    providers: {
      binance: 'ETHUSDT',
      kraken: 'XETHZUSD',
      coingecko: 'ethereum',
      kucoin: 'ETH-USDT',
    },
  },
  {
    normalized: 'BNBUSDT',
    name: 'BNB',
    providers: {
      binance: 'BNBUSDT',
      kraken: 'BNBUSDT',
      coingecko: 'binancecoin',
      kucoin: 'BNB-USDT',
    },
  },
  {
    normalized: 'SOLUSDT',
    name: 'Solana',
    providers: {
      binance: 'SOLUSDT',
      kraken: 'SOLUSD',
      coingecko: 'solana',
      kucoin: 'SOL-USDT',
    },
  },
  {
    normalized: 'XRPUSDT',
    name: 'XRP',
    providers: {
      binance: 'XRPUSDT',
      kraken: 'XXRPZUSD',
      coingecko: 'ripple',
      kucoin: 'XRP-USDT',
    },
  },
  {
    normalized: 'ADAUSDT',
    name: 'Cardano',
    providers: {
      binance: 'ADAUSDT',
      kraken: 'ADAUSD',
      coingecko: 'cardano',
      kucoin: 'ADA-USDT',
    },
  },
  {
    normalized: 'DOGEUSDT',
    name: 'Dogecoin',
    providers: {
      binance: 'DOGEUSDT',
      kraken: 'XDGUSD',
      coingecko: 'dogecoin',
      kucoin: 'DOGE-USDT',
    },
  },
  {
    normalized: 'MATICUSDT',
    name: 'Polygon',
    providers: {
      binance: 'MATICUSDT',
      kraken: 'MATICUSD',
      coingecko: 'matic-network',
      kucoin: 'MATIC-USDT',
    },
  },
  {
    normalized: 'DOTUSDT',
    name: 'Polkadot',
    providers: {
      binance: 'DOTUSDT',
      kraken: 'DOTUSD',
      coingecko: 'polkadot',
      kucoin: 'DOT-USDT',
    },
  },
  {
    normalized: 'LTCUSDT',
    name: 'Litecoin',
    providers: {
      binance: 'LTCUSDT',
      kraken: 'XLTCZUSD',
      coingecko: 'litecoin',
      kucoin: 'LTC-USDT',
    },
  },
  {
    normalized: 'LINKUSDT',
    name: 'Chainlink',
    providers: {
      binance: 'LINKUSDT',
      kraken: 'LINKUSD',
      coingecko: 'chainlink',
      kucoin: 'LINK-USDT',
    },
  },
  {
    normalized: 'AVAXUSDT',
    name: 'Avalanche',
    providers: {
      binance: 'AVAXUSDT',
      kraken: 'AVAXUSD',
      coingecko: 'avalanche-2',
      kucoin: 'AVAX-USDT',
    },
  },
];

// ── Lookup Maps ──
const BY_NORMALIZED = new Map(
  SYMBOL_REGISTRY.map(s => [s.normalized, s])
);

const BY_BINANCE = new Map(
  SYMBOL_REGISTRY
    .filter(s => s.providers.binance)
    .map(s => [s.providers.binance, s.normalized])
);

const BY_KRAKEN = new Map(
  SYMBOL_REGISTRY
    .filter(s => s.providers.kraken)
    .map(s => [s.providers.kraken, s.normalized])
);

const BY_COINGECKO = new Map(
  SYMBOL_REGISTRY
    .filter(s => s.providers.coingecko)
    .map(s => [s.providers.coingecko, s.normalized])
);

const SUPPORTED_SYMBOLS = Array.from(BY_NORMALIZED.keys());

/**
 * Try to normalize any provider symbol to our internal format.
 * Returns null if symbol is not in our registry OR if input is invalid.
 */
function normalizeSymbol(raw, provider) {
  // ⚠️ GUARD: Return null immediately if raw is undefined or null
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const upper = raw.toUpperCase().replace('-', '').replace('/', '');
  
  // Try exact match in normalized list
  if (BY_NORMALIZED.has(upper)) return upper;
  
  // Try provider-specific lookups
  if (provider === 'binance' && BY_BINANCE.has(upper)) return BY_BINANCE.get(upper);
  if (provider === 'kraken' && BY_KRAKEN.has(upper)) return BY_KRAKEN.get(upper);
  
  // Try Coingecko ID lookup
  if (BY_COINGECKO.has(raw)) return BY_COINGECKO.get(raw);
  
  // Fuzzy: search all provider fields
  for (const entry of SYMBOL_REGISTRY) {
    const pro = entry.providers;
    if (pro.binance?.toUpperCase() === upper) return entry.normalized;
    if (pro.kraken?.toUpperCase() === upper) return entry.normalized;
    if (pro.kucoin?.toUpperCase() === upper) return entry.normalized;
  }
  
  return null;
}

/**
 * Convert normalized symbol to specific provider format.
 */
function toProviderSymbol(normalized, provider) {
  if (!normalized) return null;
  
  const entry = BY_NORMALIZED.get(normalized);
  if (!entry) return null;
  return entry.providers[provider] || null;
}

/**
 * Get all supported symbols for a specific provider.
 */
function getProviderSymbols(provider) {
  const result = [];
  for (const entry of SYMBOL_REGISTRY) {
    const sym = entry.providers[provider];
    if (sym) result.push(sym);
  }
  return result;
}

module.exports = {
  SYMBOL_REGISTRY,
  BY_NORMALIZED,
  BY_BINANCE,
  BY_KRAKEN,
  BY_COINGECKO,
  SUPPORTED_SYMBOLS,
  normalizeSymbol,
  toProviderSymbol,
  getProviderSymbols,
};