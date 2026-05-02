// src/services/market/types.js
// ── TYPE DEFINITIONS (JSDoc for IDE support, no runtime types) ──

/**
 * @typedef {Object} NormalizedPrice
 * @property {string}  symbol     - "BTCUSDT"
 * @property {number}  price      - Current price
 * @property {number}  [change24h] - 24h change percentage
 * @property {number}  [high24h]  - 24h high
 * @property {number}  [low24h]   - 24h low
 * @property {number}  [volume24h] - 24h volume
 * @property {number}  timestamp  - Unix ms
 * @property {string}  provider   - Provider name
 */

/**
 * @typedef {Object} NormalizedCandle
 * @property {number}  time   - Unix SECONDS (TradingView format)
 * @property {number}  open
 * @property {number}  high
 * @property {number}  low
 * @property {number}  close
 * @property {number}  [volume]
 */

/**
 * @typedef {Object} NormalizedMarket
 * @property {string}  symbol
 * @property {string}  name
 * @property {string}  [image]
 * @property {number}  price
 * @property {number}  change24h
 * @property {number}  volume24h
 * @property {number}  [marketCap]
 * @property {number}  [high24h]
 * @property {number}  [low24h]
 */

/**
 * @typedef {Object} ProviderHealth
 * @property {string}  name
 * @property {boolean} healthy
 * @property {number}  lastCheck
 * @property {string}  [lastError]
 * @property {number}  latency
 */

/**
 * @typedef {Object} ProviderResult
 * @property {boolean} success
 * @property {*}       [data]
 * @property {string}  provider
 * @property {number}  latency
 * @property {string}  [error]
 * @property {boolean} [fromCache]
 */

/**
 * @typedef {'1m'|'5m'|'15m'|'30m'|'1h'|'4h'|'1d'|'1w'} CandleInterval
 */

/**
 * @typedef {'crypto'|'forex'|'metals'} MarketAssetClass
 */

module.exports = {};
// Types are JSDoc only — no runtime exports needed