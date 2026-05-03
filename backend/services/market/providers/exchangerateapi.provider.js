// src/services/market/providers/exchangerateapi.provider.js
// ── EXCHANGERATE-API.COM PROVIDER (forex, free, no key) ──

const { BaseProvider } = require('./base.provider');

class ExchangeRateApiProvider extends BaseProvider {
  get name() { return 'exchangerate-api.com'; }
  get config() {
    return {
      name: 'exchangerate-api.com',
      priority: 4,
      baseUrl: 'https://open.er-api.com/v6',
      rateLimit: { requests: 100, windowMs: 60000 },
      timeout: 5000,
    };
  }

  async fetchPrice(symbol) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    
    // This API only supports USD as base for all rates
    const url = `${this.config.baseUrl}/latest/USD`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`er-api HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('er-api: bad response');

    const rates = data.rates || {};

    let price;
    if (base === 'USD') {
      // USDJPY, USDCHF — direct rate
      price = rates[quote];
    } else {
      // EURUSD, GBPUSD, AUDUSD — invert
      const usdToBase = rates[base];
      if (!usdToBase) throw new Error(`er-api: No rate for ${base}`);
      price = 1 / usdToBase;
    }

    if (!price && price !== 0) throw new Error(`er-api: Cannot calculate ${symbol}`);
    
    const decimals = symbol.includes('JPY') ? 3 : 4;
    return {
      symbol,
      price: Number(price.toFixed(decimals)),
      change24h: null,
      high24h: null,
      low24h: null,
      volume24h: 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    // This API doesn't provide candles
    return [];
  }

  async fetchMarkets() { return []; }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/latest/USD`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { ExchangeRateApiProvider };