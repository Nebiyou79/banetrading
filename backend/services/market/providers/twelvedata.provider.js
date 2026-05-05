// services/market/providers/twelvedata.provider.js
// ── TWELVE DATA PROVIDER (forex ONLY — not metals) ──
// FIXED: Removed metals (XAUUSD/XAGUSD) support — free tier doesn't include them.
// Added rate limit tracker — max 8 req/min on free tier.

const { BaseProvider } = require('./base.provider');

// Metals are NOT supported on TwelveData free tier
const UNSUPPORTED_SYMBOLS = new Set(['XAUUSD', 'XAGUSD']);

// ── Simple rate limiter: max 8 requests per 60s ──
const TD_RATE_LIMIT   = 8;
const TD_WINDOW_MS    = 60_000;
const tdTimestamps    = [];

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

class TwelveDataProvider extends BaseProvider {
  get name() { return 'twelvedata'; }

  get config() {
    return {
      name:      'twelvedata',
      priority:  1,
      baseUrl:   'https://api.twelvedata.com',
      rateLimit: { requests: 8, windowMs: 60000 },
      timeout:   8000,
    };
  }

  get apiKey() { return process.env.TWELVEDATA_API_KEY || ''; }

  /** Returns true if the symbol is supported (forex only, not metals) */
  supportsSymbol(symbol) {
    if (UNSUPPORTED_SYMBOLS.has(symbol.toUpperCase())) return false;
    if (!this.apiKey) return false; // skip entirely if no API key
    return true;
  }

  async fetchPrice(symbol) {
    if (!this.supportsSymbol(symbol)) {
      throw new Error(`TwelveData: ${symbol} not supported on free tier`);
    }
    if (!tdCanRequest()) {
      throw new Error(`TwelveData: Rate limit reached (${TD_RATE_LIMIT} req/min)`);
    }

    const tdSymbol = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
    const url      = `${this.config.baseUrl}/quote?symbol=${tdSymbol}&apikey=${this.apiKey}`;

    let res;
    try {
      res = await this.timeout(fetch(url), this.config.timeout);
    } catch (err) {
      throw new Error(`TwelveData fetch failed: ${err.message}`);
    }
    tdRecordRequest();
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'error') throw new Error(`TwelveData: ${data.message}`);

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
    if (!tdCanRequest()) {
      throw new Error(`TwelveData: Rate limit reached (${TD_RATE_LIMIT} req/min)`);
    }

    const tdSymbol    = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
    const intervalMap = {
      '1m':'1min','5m':'5min','15m':'15min','30m':'30min',
      '1h':'1h','4h':'4h','1d':'1day','1w':'1week',
    };
    const tdInterval = intervalMap[interval] || '1h';
    const url        = `${this.config.baseUrl}/time_series?symbol=${tdSymbol}&interval=${tdInterval}&outputsize=${limit}&apikey=${this.apiKey}`;

    let res;
    try {
      res = await this.timeout(fetch(url), this.config.timeout);
    } catch (err) {
      throw new Error(`TwelveData candles fetch failed: ${err.message}`);
    }
    tdRecordRequest();
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'error') throw new Error(`TwelveData: ${data.message}`);

    const values = data.values || [];
    return values.reverse().map(v => ({
      time:   Math.floor(new Date(v.datetime).getTime() / 1000),
      open:   parseFloat(v.open) || 0,
      high:   parseFloat(v.high) || 0,
      low:    parseFloat(v.low) || 0,
      close:  parseFloat(v.close) || 0,
      volume: 0,
    }));
  }

  async fetchMarkets() { return []; }

  async healthCheck() {
    if (!this.apiKey || !tdCanRequest()) return false;
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