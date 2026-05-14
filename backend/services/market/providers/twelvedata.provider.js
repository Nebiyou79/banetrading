// services/market/providers/twelvedata.provider.js
// ── TWELVE DATA PROVIDER (forex + XAUUSD metals) ──
// FIX: XAUUSD IS supported on free tier. Only XAGUSD is not.
// FIX: On first 429, blacklist immediately for 60s (no retries).

const { BaseProvider } = require('./base.provider');

// Only XAGUSD is unsupported on TwelveData free tier. XAUUSD works fine.
const UNSUPPORTED_SYMBOLS = new Set(['XAGUSD']);

// Tight rate limit — max 8 req/min on free tier
const TD_RATE_LIMIT = 8;
const TD_WINDOW_MS  = 60_000;
const tdTimestamps  = [];

function tdCanRequest() {
  const now = Date.now();
  while (tdTimestamps.length > 0 && now - tdTimestamps[0] > TD_WINDOW_MS) {
    tdTimestamps.shift();
  }
  return tdTimestamps.length < TD_RATE_LIMIT;
}

function tdRecordRequest() {
  tdTimestamps.push(Date.now());
}

const PROVIDER_NAME = 'twelvedata';
let blacklistedUntil = 0;

function isBlacklisted() {
  return Date.now() < blacklistedUntil;
}

function blacklistFor60s() {
  blacklistedUntil = Date.now() + 60_000;
  console.warn(`[TwelveData] Rate limited — blacklisting for 60s`);
}

class TwelveDataProvider extends BaseProvider {
  get name() { return PROVIDER_NAME; }

  get config() {
    return {
      name:      PROVIDER_NAME,
      priority:  1,
      baseUrl:   'https://api.twelvedata.com',
      rateLimit: { requests: 8, windowMs: 60000 },
      timeout:   8000,
    };
  }

  get apiKey() { return process.env.TWELVEDATA_API_KEY || ''; }

  supportsSymbol(symbol) {
    if (UNSUPPORTED_SYMBOLS.has(symbol.toUpperCase())) return false;
    if (!this.apiKey) return false;
    return true;
  }

  async fetchPrice(symbol) {
    if (!this.supportsSymbol(symbol)) {
      throw new Error(`TwelveData: ${symbol} not supported on free tier`);
    }
    if (isBlacklisted()) {
      throw new Error(`TwelveData: Blacklisted until rate limit resets`);
    }
    if (!tdCanRequest()) {
      blacklistFor60s();
      throw new Error(`TwelveData: Rate limit reached — blacklisted for 60s`);
    }

    const tdSymbol = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
    const url = `${this.config.baseUrl}/quote?symbol=${tdSymbol}&apikey=${this.apiKey}`;

    let res;
    try {
      res = await this.timeout(fetch(url), this.config.timeout);
    } catch (err) {
      throw new Error(`TwelveData fetch failed: ${err.message}`);
    }

    tdRecordRequest();

    if (res.status === 429) {
      blacklistFor60s();
      throw new Error(`TwelveData: 429 rate limited — blacklisted for 60s`);
    }
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);

    const data = await res.json();
    if (data.status === 'error') {
      if (data.code === 429) blacklistFor60s();
      throw new Error(`TwelveData: ${data.message}`);
    }

    return {
      symbol,
      price:     parseFloat(data.close) || 0,
      change24h: parseFloat(data.percent_change) || 0,
      high24h:   parseFloat(data.high) || null,
      low24h:    parseFloat(data.low) || null,
      volume24h: 0,
      timestamp: Date.now(),
      provider:  this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    if (!this.supportsSymbol(symbol)) {
      throw new Error(`TwelveData: ${symbol} not supported on free tier`);
    }
    if (isBlacklisted()) {
      throw new Error(`TwelveData: Blacklisted until rate limit resets`);
    }
    if (!tdCanRequest()) {
      blacklistFor60s();
      throw new Error(`TwelveData: Rate limit reached — blacklisted for 60s`);
    }

    const tdSymbol    = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
    const intervalMap = {
      '1m':'1min','5m':'5min','15m':'15min','30m':'30min',
      '1h':'1h','4h':'4h','1d':'1day','1w':'1week',
    };
    const tdInterval = intervalMap[interval] || '1h';
    const url = `${this.config.baseUrl}/time_series?symbol=${tdSymbol}&interval=${tdInterval}&outputsize=${limit}&apikey=${this.apiKey}`;

    let res;
    try {
      res = await this.timeout(fetch(url), this.config.timeout);
    } catch (err) {
      throw new Error(`TwelveData candles fetch failed: ${err.message}`);
    }

    tdRecordRequest();

    if (res.status === 429) {
      blacklistFor60s();
      throw new Error(`TwelveData: 429 rate limited — blacklisted for 60s`);
    }
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);

    const data = await res.json();
    if (data.status === 'error') {
      if (data.code === 429) blacklistFor60s();
      throw new Error(`TwelveData: ${data.message}`);
    }

    const values = data.values || [];
    return values.reverse().map(v => ({
      time:   Math.floor(new Date(v.datetime).getTime() / 1000),
      open:   parseFloat(v.open) || 0,
      high:   parseFloat(v.high) || 0,
      low:    parseFloat(v.low) || 0,
      close:  parseFloat(v.close) || 0,
      volume: 0,
    })).filter(c => c.time > 0 && c.open > 0 && c.high >= c.low);
  }

  async fetchMarkets() { return []; }

  async healthCheck() {
    if (!this.apiKey || !tdCanRequest() || isBlacklisted()) return false;
    try {
      const res = await this.timeout(
        fetch(`${this.config.baseUrl}/quote?symbol=EUR/USD&apikey=${this.apiKey}`),
        3000
      );
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { TwelveDataProvider };