// src/services/market/symbols/symbol.map.js
// ── UNIVERSAL SYMBOL MAPPING ──
// All symbols normalize to Binance format (e.g., "BTCUSDT")

const SYMBOL_REGISTRY = [
  // ── Crypto (all supported pairs) ──
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
  {
    normalized: 'TRXUSDT',
    name: 'TRON',
    providers: {
      binance: 'TRXUSDT',
      kraken: 'TRXUSD',
      coingecko: 'tron',
      kucoin: 'TRX-USDT',
    },
  },
  {
    normalized: 'BCHUSDT',
    name: 'Bitcoin Cash',
    providers: {
      binance: 'BCHUSDT',
      kraken: 'BCHUSD',
      coingecko: 'bitcoin-cash',
      kucoin: 'BCH-USDT',
    },
  },
  {
    normalized: 'UNIUSDT',
    name: 'Uniswap',
    providers: {
      binance: 'UNIUSDT',
      kraken: 'UNIUSD',
      coingecko: 'uniswap',
      kucoin: 'UNI-USDT',
    },
  },
  {
    normalized: 'ATOMUSDT',
    name: 'Cosmos',
    providers: {
      binance: 'ATOMUSDT',
      kraken: 'ATOMUSD',
      coingecko: 'cosmos',
      kucoin: 'ATOM-USDT',
    },
  },
  {
    normalized: 'ETCUSDT',
    name: 'Ethereum Classic',
    providers: {
      binance: 'ETCUSDT',
      kraken: 'ETCUSD',
      coingecko: 'ethereum-classic',
      kucoin: 'ETC-USDT',
    },
  },

  // ── Forex pairs ──
  {
    normalized: 'EURUSD',
    name: 'Euro / US Dollar',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      twelvedata: 'EUR/USD',
    },
  },
  {
    normalized: 'GBPUSD',
    name: 'British Pound / US Dollar',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      twelvedata: 'GBP/USD',
    },
  },
  {
    normalized: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      twelvedata: 'USD/JPY',
    },
  },
  {
    normalized: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      twelvedata: 'USD/CHF',
    },
  },
  {
    normalized: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      twelvedata: 'AUD/USD',
    },
  },

  // ── Metals ──
  {
    normalized: 'XAUUSD',
    name: 'Gold / US Dollar',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      metals: 'XAU',
      twelvedata: 'XAU/USD',
    },
  },
  {
    normalized: 'XAGUSD',
    name: 'Silver / US Dollar',
    providers: {
      binance: null,
      kraken: null,
      coingecko: null,
      kucoin: null,
      metals: 'XAG',
      twelvedata: 'XAG/USD',
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
 * Normalize a symbol to internal format.
 * Handles variations like "ADA", "ADAUSDT", "ada-usdt", etc.
 */
function normalizeSymbol(raw, provider) {
  if (!raw || typeof raw !== 'string') return null;

  // Clean the input
  const upper = raw.toUpperCase().replace('-', '').replace('/', '').replace('_', '').trim();

  // Try exact match
  if (BY_NORMALIZED.has(upper)) return upper;

  // Try appending USDT for crypto symbols that might be missing it
  // e.g., "ADA" → "ADAUSDT"
  if (!upper.endsWith('USDT') && !upper.endsWith('USD')) {
    const withUsdt = upper + 'USDT';
    if (BY_NORMALIZED.has(withUsdt)) return withUsdt;
  }

  // Try provider-specific lookups
  if (provider === 'binance' && BY_BINANCE.has(upper)) return BY_BINANCE.get(upper);
  if (provider === 'kraken' && BY_KRAKEN.has(upper)) return BY_KRAKEN.get(upper);
  if (BY_COINGECKO.has(raw.toLowerCase())) return BY_COINGECKO.get(raw.toLowerCase());

  // Fuzzy: search all provider fields
  for (const entry of SYMBOL_REGISTRY) {
    const pro = entry.providers;
    if (pro.binance?.toUpperCase() === upper) return entry.normalized;
    if (pro.kraken?.toUpperCase() === upper) return entry.normalized;
    if (pro.kucoin?.toUpperCase() === upper) return entry.normalized;
    if (pro.twelvedata?.toUpperCase().replace('/', '') === upper) return entry.normalized;
    if (pro.metals?.toUpperCase() === upper) return entry.normalized;
  }

  // If still not found but ends with USDT — treat it as a valid crypto symbol
  // This handles symbols that might not be in our registry yet
  if (upper.endsWith('USDT') && upper.length >= 6) {
    // Auto-register it (lazy registration)
    const baseName = upper.replace('USDT', '');
    SYMBOL_REGISTRY.push({
      normalized: upper,
      name: baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase(),
      providers: {
        binance: upper,
        kraken: null,
        coingecko: null,
        kucoin: upper.replace('USDT', '-USDT'),
      },
    });
    BY_NORMALIZED.set(upper, SYMBOL_REGISTRY[SYMBOL_REGISTRY.length - 1]);
    BY_BINANCE.set(upper, upper);
    return upper;
  }

  // Handle forex pairs that entered without USD suffix
  const forexBases = ['EUR', 'GBP', 'AUD'];
  const forexQuotes = ['USD', 'JPY', 'CHF'];
  
  // Check if it looks like a forex pair
  if (upper.length === 6) {
    const base = upper.slice(0, 3);
    const quote = upper.slice(3);
    if ((forexBases.includes(base) || forexQuotes.includes(base)) &&
        (forexBases.includes(quote) || forexQuotes.includes(quote))) {
      // Auto-register forex pair
      const display = `${base}/${quote}`;
      SYMBOL_REGISTRY.push({
        normalized: upper,
        name: `${base} / ${quote}`,
        providers: {
          binance: null,
          kraken: null,
          coingecko: null,
          kucoin: null,
          twelvedata: display,
        },
      });
      BY_NORMALIZED.set(upper, SYMBOL_REGISTRY[SYMBOL_REGISTRY.length - 1]);
      return upper;
    }
  }

  return null;
}

function toProviderSymbol(normalized, provider) {
  if (!normalized) return null;
  const entry = BY_NORMALIZED.get(normalized);
  if (!entry) return null;
  return entry.providers[provider] || null;
}

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