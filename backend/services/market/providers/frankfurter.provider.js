// src/services/market/providers/frankfurter.provider.js
// ── FRANKFURTER PROVIDER (forex daily candles, free, no key) ──

const { BaseProvider } = require('./base.provider');

class FrankfurterProvider extends BaseProvider {
  get name() { return 'frankfurter'; }
  get config() {
    return {
      name: 'frankfurter',
      priority: 3,
      baseUrl: 'https://api.frankfurter.app',
      rateLimit: { requests: 100, windowMs: 60000 },
      timeout: 8000,
    };
  }

  async fetchPrice(symbol) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    const url = `${this.config.baseUrl}/latest?from=${base}&to=${quote}`;
    
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
    const data = await res.json();

    const rate = data.rates?.[quote];
    if (!rate) throw new Error(`Frankfurter: No rate for ${quote}`);

    return {
      symbol,
      price: Number(rate),
      change24h: null,
      high24h: null,
      low24h: null,
      volume24h: 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    if (!['1d', '1w'].includes(interval)) return [];

    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    const days = interval === '1w' ? Math.min(limit * 7, 365) : Math.min(limit, 90);
    
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const endStr = end.toISOString().slice(0, 10);
    const startStr = start.toISOString().slice(0, 10);

    const url = `${this.config.baseUrl}/${startStr}..${endStr}?from=${base}&to=${quote}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Frankfurter HTTP ${res.status}`);
    const data = await res.json();

    const rates = data.rates || {};
    const candles = Object.entries(rates)
      .map(([date, rateObj]) => {
        const rate = rateObj[quote];
        if (!rate) return null;
        return {
          time: Math.floor(new Date(date).getTime() / 1000),
          open: Number(rate),
          high: Number(rate),
          low: Number(rate),
          close: Number(rate),
          volume: 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    return candles.slice(-limit);
  }

  async fetchMarkets() { return []; }

  async healthCheck() {
    try {
      const res = await this.timeout(
        fetch(`${this.config.baseUrl}/latest?from=USD&to=EUR`),
        3000
      );
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { FrankfurterProvider };