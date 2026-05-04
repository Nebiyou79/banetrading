// services/market/providers/twelvedata.provider.js
// ── TWELVE DATA PROVIDER (forex + metals, 800 req/day free) ──

const { BaseProvider } = require('./base.provider');

class TwelveDataProvider extends BaseProvider {
  get name() { return 'twelvedata'; }
  get config() {
    return {
      name: 'twelvedata',
      priority: 1,
      baseUrl: 'https://api.twelvedata.com',
      rateLimit: { requests: 8, windowMs: 60000 },
      timeout: 8000,
    };
  }

  get apiKey() { return process.env.TWELVEDATA_API_KEY || ''; }

  async fetchPrice(symbol) {
    // symbol = "EURUSD" → "EUR/USD"
    const tdSymbol = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
    const url = `${this.config.baseUrl}/quote?symbol=${tdSymbol}&apikey=${this.apiKey}`;
    
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'error') throw new Error(`TwelveData: ${data.message}`);

    return {
      symbol,
      price: parseFloat(data.close) || 0,
      change24h: parseFloat(data.percent_change) || 0,
      high24h: parseFloat(data.high) || null,
      low24h: parseFloat(data.low) || null,
      volume24h: 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const tdSymbol = symbol.length === 6 ? `${symbol.slice(0, 3)}/${symbol.slice(3)}` : symbol;
    
    const intervalMap = {
      '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
      '1h': '1h', '4h': '4h', '1d': '1day', '1w': '1week',
    };
    const tdInterval = intervalMap[interval] || '1h';

    const url = `${this.config.baseUrl}/time_series?symbol=${tdSymbol}&interval=${tdInterval}&outputsize=${limit}&apikey=${this.apiKey}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'error') throw new Error(`TwelveData: ${data.message}`);

    const values = data.values || [];
    return values.reverse().map(v => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open) || 0,
      high: parseFloat(v.high) || 0,
      low: parseFloat(v.low) || 0,
      close: parseFloat(v.close) || 0,
      volume: 0,
    }));
  }

  async fetchMarkets() { return []; }

  async healthCheck() {
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