// src/services/market/providers/exchangeratehost.provider.js
// ── EXCHANGERATE.HOST PROVIDER (forex + metals, with API key) ──

const { BaseProvider } = require('./base.provider');

class ExchangeRateHostProvider extends BaseProvider {
  get name() { return 'exchangerate.host'; }
  get config() {
    return {
      name: 'exchangerate.host',
      priority: 2,
      baseUrl: 'https://api.exchangerate.host',
      rateLimit: { requests: 100, windowMs: 60000 },
      timeout: 8000,
    };
  }

  get apiKey() { return process.env.EXCANGERATE_HOST_API_KEY || ''; }

  async fetchPrice(symbol) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    const url = `${this.config.baseUrl}/live?access_key=${this.apiKey}&source=${base}&currencies=${quote}&format=1`;
    
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`exchangerate.host HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(`exchangerate.host: ${data.error?.info || 'Unknown error'}`);

    const rate = data.quotes?.[`${base}${quote}`];
    if (!rate) throw new Error(`exchangerate.host: No rate for ${base}${quote}`);

    // For metals (XAU, XAG), the rate is USD per ounce — direct
    // For forex, it depends on the pair direction
    let price;
    if (base === 'USD') {
      price = rate;
    } else {
      price = 1 / rate;
    }

    return {
      symbol,
      price,
      change24h: null,
      high24h: null,
      low24h: null,
      volume24h: 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    // Only daily/weekly
    if (!['1d', '1w'].includes(interval)) return [];

    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3);
    const days = interval === '1w' ? Math.min(limit * 7, 365) : Math.min(limit, 90);
    
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const endStr = end.toISOString().slice(0, 10);
    const startStr = start.toISOString().slice(0, 10);

    const url = `${this.config.baseUrl}/timeframe?access_key=${this.apiKey}&source=${base}&currencies=${quote}&start_date=${startStr}&end_date=${endStr}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`exchangerate.host HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(`exchangerate.host: ${data.error?.info || 'Unknown error'}`);

    const quotes = data.quotes || {};
    const candles = Object.entries(quotes)
      .map(([date, rates]) => {
        const rate = rates[`${base}${quote}`];
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
        fetch(`${this.config.baseUrl}/live?access_key=${this.apiKey}&source=USD&currencies=EUR&format=1`),
        3000
      );
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { ExchangeRateHostProvider };