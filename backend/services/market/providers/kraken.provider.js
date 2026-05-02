// src/services/market/providers/kraken.provider.js
// ── KRAKEN PROVIDER (Fallback crypto) ──

const { BaseProvider } = require('./base.provider');
const { KRAKEN_INTERVAL_MAP } = require('../constants');
const { normalizeSymbol, toProviderSymbol } = require('../symbols/symbol.map');

class KrakenProvider extends BaseProvider {
  get name() {
    return 'kraken';
  }

  get config() {
    return {
      name: 'kraken',
      priority: 2,
      baseUrl: 'https://api.kraken.com/0/public',
      rateLimit: { requests: 60, windowMs: 60000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const url = `${this.config.baseUrl}/Ticker`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`Kraken HTTP ${res.status}`);
    const data = await res.json();
    
    if (data.error?.length > 0) throw new Error(`Kraken: ${data.error[0]}`);
    
    /** @type {import('../types').NormalizedMarket[]} */
    const markets = [];
    const result = data.result || {};
    
    for (const [pair, ticker] of Object.entries(result)) {
      const normalized = normalizeSymbol(pair, 'kraken');
      if (!normalized) continue;
      
      const t = ticker;
      markets.push({
        symbol: normalized,
        name: normalized.replace('USDT', '').replace('USD', ''),
        price: this.safeNumber(t.c?.[0]),
        change24h: this.safeNumber(t.c?.[0]) > 0 && this.safeNumber(t.o) > 0
          ? ((this.safeNumber(t.c[0]) - this.safeNumber(t.o)) / this.safeNumber(t.o)) * 100
          : 0,
        volume24h: this.safeNumber(t.v?.[1]),
        high24h: this.safeNumber(t.h?.[1]),
        low24h: this.safeNumber(t.l?.[1]),
      });
    }
    return markets;
  }

  async fetchPrice(symbol) {
    const krakenPair = toProviderSymbol(symbol, 'kraken');
    if (!krakenPair) throw new Error(`Kraken does not support ${symbol}`);
    
    const url = `${this.config.baseUrl}/Ticker?pair=${krakenPair}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`Kraken HTTP ${res.status}`);
    const data = await res.json();
    
    if (data.error?.length > 0) throw new Error(`Kraken: ${data.error[0]}`);
    
    const ticker = data.result?.[krakenPair];
    if (!ticker) throw new Error(`Kraken: No data for ${krakenPair}`);
    
    const t = ticker;
    return {
      symbol,
      price: this.safeNumber(t.c?.[0]),
      change24h: this.safeNumber(t.c?.[0]) > 0 && this.safeNumber(t.o) > 0
        ? ((this.safeNumber(t.c[0]) - this.safeNumber(t.o)) / this.safeNumber(t.o)) * 100
        : 0,
      high24h: this.safeNumber(t.h?.[1]),
      low24h: this.safeNumber(t.l?.[1]),
      volume24h: this.safeNumber(t.v?.[1]),
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const krakenPair = toProviderSymbol(symbol, 'kraken');
    if (!krakenPair) throw new Error(`Kraken does not support ${symbol}`);
    
    const krakenInterval = KRAKEN_INTERVAL_MAP[interval] || 60;
    const url = `${this.config.baseUrl}/OHLC?pair=${krakenPair}&interval=${krakenInterval}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`Kraken OHLC HTTP ${res.status}`);
    const data = await res.json();
    
    if (data.error?.length > 0) throw new Error(`Kraken: ${data.error[0]}`);
    
    const candles = data.result?.[krakenPair];
    if (!candles) return [];
    
    return candles.slice(-limit).map(k => ({
      time:   Math.floor(k[0]),
      open:   this.safeNumber(k[1]),
      high:   this.safeNumber(k[2]),
      low:    this.safeNumber(k[3]),
      close:  this.safeNumber(k[4]),
      volume: this.safeNumber(k[6]),
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(
        fetch(`${this.config.baseUrl}/Time`),
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { KrakenProvider };