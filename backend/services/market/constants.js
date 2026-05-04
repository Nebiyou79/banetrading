// services/market/constants.js
// ── MARKET DATA SYSTEM CONSTANTS ──

// Cache TTLs (seconds)
const CACHE_TTL = {
  PRICE:    5,        // live price — 5s
  CANDLES:  10,       // chart data — 10s
  MARKETS:  60,       // market list — 60s
  METADATA: 86400,    // coin info — 1 day
  HEALTH:   30,       // provider health — 30s
};

// Provider timeouts (ms)
const PROVIDER_TIMEOUT = {
  BINANCE:   5000,
  KRAKEN:    5000,
  COINGECKO: 8000,
  KUCOIN:    5000,
};

// Rate limit windows
const RATE_LIMITS = {
  COINGECKO: { requests: 30,  windowMs: 60000 },
  BINANCE:   { requests: 1200, windowMs: 60000 },
  KRAKEN:    { requests: 60,   windowMs: 60000 },
  KUCOIN:    { requests: 100,  windowMs: 10000 },
};

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES:         3,
  INITIAL_DELAY:       1000,
  MAX_DELAY:           30000,
  BACKOFF_MULTIPLIER:  2,
  RETRYABLE_STATUSES:  [429, 502, 503, 504],
};

// WebSocket reconnect
const WS_RECONNECT = {
  INITIAL_DELAY:  1000,
  MAX_DELAY:      30000,
  MULTIPLIER:     2,
  MAX_ATTEMPTS:   10,
};

// Provider priority (lower = try first)
const PROVIDER_PRIORITY = {
  BINANCE:    1,
  KRAKEN:     2,
  COINGECKO:  3,
  KUCOIN:     4,
};

// Supported crypto pairs
const SUPPORTED_CRYPTO = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
  'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'MATICUSDT',
  'DOTUSDT', 'LTCUSDT', 'LINKUSDT', 'AVAXUSDT',
  'UNIUSDT', 'ATOMUSDT', 'ETCUSDT',
];

// Binance interval mapping
const BINANCE_INTERVAL_MAP = {
  '1m':  '1m',  '5m':  '5m',  '15m': '15m',
  '30m': '30m', '1h':  '1h',  '4h':  '4h',
  '1d':  '1d',  '1w':  '1w',
};

// Kraken interval mapping
const KRAKEN_INTERVAL_MAP = {
  '1m':  1,   '5m':  5,   '15m': 15,
  '30m': 30,  '1h':  60,  '4h':  240,
  '1d':  1440, '1w': 10080,
};

module.exports = {
  CACHE_TTL,
  PROVIDER_TIMEOUT,
  RATE_LIMITS,
  RETRY_CONFIG,
  WS_RECONNECT,
  PROVIDER_PRIORITY,
  SUPPORTED_CRYPTO,
  BINANCE_INTERVAL_MAP,
  KRAKEN_INTERVAL_MAP,
};