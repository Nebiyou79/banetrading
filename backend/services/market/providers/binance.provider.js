// src/services/market/providers/binance.provider.js
// ── BINANCE PROVIDER (Primary — real-time + candles) ──

const { BaseProvider } = require('./base.provider');
const { BINANCE_INTERVAL_MAP } = require('../constants');
const { BY_BINANCE } = require('../symbols/symbol.map');

class BinanceProvider extends BaseProvider {
  get name() {
    return 'binance';
  }

  get config() {
    return {
      name: 'binance',
      priority: 1,
      baseUrl: 'https://api.binance.com/api/v3',
      rateLimit: { requests: 1200, windowMs: 60000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const url = `${this.config.baseUrl}/ticker/24hr`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const data = await res.json();
    
    /** @type {import('../types').NormalizedMarket[]} */
    const markets = [];
    for (const ticker of data) {
      const normalized = BY_BINANCE.get(ticker.symbol);
      if (!normalized) continue;
      
      markets.push({
        symbol: normalized,
        name: normalized.replace('USDT', ''),
        price: this.safeNumber(ticker.lastPrice),
        change24h: this.safeNumber(ticker.priceChangePercent),
        volume24h: this.safeNumber(ticker.quoteVolume),
        high24h: this.safeNumber(ticker.highPrice),
        low24h: this.safeNumber(ticker.lowPrice),
      });
    }
    return markets;
  }

  async fetchPrice(symbol) {
    const url = `${this.config.baseUrl}/ticker/24hr?symbol=${symbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const d = await res.json();
    
    return {
      symbol,
      price: this.safeNumber(d.lastPrice),
      change24h: this.safeNumber(d.priceChangePercent),
      high24h: this.safeNumber(d.highPrice),
      low24h: this.safeNumber(d.lowPrice),
      volume24h: this.safeNumber(d.quoteVolume),
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const binanceInterval = BINANCE_INTERVAL_MAP[interval] || '1h';
    const url = `${this.config.baseUrl}/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`Binance klines HTTP ${res.status}`);
    const data = await res.json();
    
    return data.map(k => ({
      time:   Math.floor(k[0] / 1000),
      open:   this.safeNumber(k[1]),
      high:   this.safeNumber(k[2]),
      low:    this.safeNumber(k[3]),
      close:  this.safeNumber(k[4]),
      volume: this.safeNumber(k[5]),
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(
        fetch(`${this.config.baseUrl}/ping`),
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { BinanceProvider };