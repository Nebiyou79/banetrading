// src/services/market/providers/bybit.provider.js
// ── BYBIT PROVIDER (free, no key, 50 req/sec) ──

const { BaseProvider } = require('./base.provider');

const BYBIT_SYMBOL_MAP = {
  'BTCUSDT': 'BTCUSDT', 'ETHUSDT': 'ETHUSDT', 'BNBUSDT': 'BNBUSDT',
  'SOLUSDT': 'SOLUSDT', 'XRPUSDT': 'XRPUSDT', 'ADAUSDT': 'ADAUSDT',
  'DOGEUSDT': 'DOGEUSDT', 'MATICUSDT': 'MATICUSDT', 'DOTUSDT': 'DOTUSDT',
  'LTCUSDT': 'LTCUSDT', 'LINKUSDT': 'LINKUSDT', 'AVAXUSDT': 'AVAXUSDT',
};

class BybitProvider extends BaseProvider {
  get name() { return 'bybit'; }

  get config() {
    return {
      name: 'bybit',
      priority: 5,
      baseUrl: 'https://api.bybit.com/v5/market',
      rateLimit: { requests: 50, windowMs: 1000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const url = `${this.config.baseUrl}/tickers?category=spot`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Bybit HTTP ${res.status}`);
    const data = await res.json();
    const list = data?.result?.list || [];

    return list
      .filter(t => BYBIT_SYMBOL_MAP[t.symbol])
      .map(t => ({
        symbol: t.symbol,
        name: t.symbol.replace('USDT', ''),
        image: null,
        price: parseFloat(t.lastPrice) || 0,
        change24h: parseFloat(t.price24hPcnt) * 100 || 0,
        volume24h: parseFloat(t.volume24h) || 0,
        marketCap: null,
        high24h: parseFloat(t.highPrice24h) || null,
        low24h: parseFloat(t.lowPrice24h) || null,
      }));
  }

  async fetchPrice(symbol) {
    const url = `${this.config.baseUrl}/tickers?category=spot&symbol=${symbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Bybit HTTP ${res.status}`);
    const data = await res.json();
    const t = data?.result?.list?.[0];
    if (!t) throw new Error('Bybit: No data');

    return {
      symbol,
      price: parseFloat(t.lastPrice) || 0,
      change24h: parseFloat(t.price24hPcnt) * 100 || 0,
      high24h: parseFloat(t.highPrice24h) || null,
      low24h: parseFloat(t.lowPrice24h) || null,
      volume24h: parseFloat(t.volume24h) || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const invMap = {
      '1m': '1', '5m': '5', '15m': '15', '30m': '30',
      '1h': '60', '4h': '240', '1d': 'D', '1w': 'W',
    };
    const inv = invMap[interval] || '60';
    const url = `${this.config.baseUrl}/kline?category=spot&symbol=${symbol}&interval=${inv}&limit=${limit}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Bybit kline HTTP ${res.status}`);
    const data = await res.json();
    const list = data?.result?.list || [];

    // Bybit returns newest first — reverse to chronological
    return list.reverse().map(k => ({
      time: Math.floor(parseFloat(k[0]) / 1000),
      open: parseFloat(k[1]) || 0,
      high: parseFloat(k[2]) || 0,
      low: parseFloat(k[3]) || 0,
      close: parseFloat(k[4]) || 0,
      volume: parseFloat(k[5]) || 0,
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/time`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { BybitProvider };