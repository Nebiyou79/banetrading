// src/services/market/providers/okx.provider.js
// ── OKX PROVIDER (free, no key, 10 req/sec) ──
// API: https://www.okx.com/api/v5
// Docs: https://www.okx.com/docs-v5/

const { BaseProvider } = require('./base.provider');

const OKX_SYMBOL_MAP = {
  'BTCUSDT': 'BTC-USDT',
  'ETHUSDT': 'ETH-USDT',
  'BNBUSDT': 'BNB-USDT',
  'SOLUSDT': 'SOL-USDT',
  'XRPUSDT': 'XRP-USDT',
  'ADAUSDT': 'ADA-USDT',
  'DOGEUSDT': 'DOGE-USDT',
  'TRXUSDT': 'TRX-USDT',
  'MATICUSDT': 'MATIC-USDT',
  'DOTUSDT': 'DOT-USDT',
  'LTCUSDT': 'LTC-USDT',
  'AVAXUSDT': 'AVAX-USDT',
  'LINKUSDT': 'LINK-USDT',
  'BCHUSDT': 'BCH-USDT',
  'UNIUSDT': 'UNI-USDT',
  'ATOMUSDT': 'ATOM-USDT',
  'ETCUSDT': 'ETC-USDT',
};

class OkxProvider extends BaseProvider {
  get name() { return 'okx'; }

  get config() {
    return {
      name: 'okx',
      priority: 3,
      baseUrl: 'https://www.okx.com/api/v5',
      rateLimit: { requests: 20, windowMs: 2000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const symbols = Object.values(OKX_SYMBOL_MAP).join(',');
    const url = `${this.config.baseUrl}/market/tickers?instType=SPOT&instId=${symbols}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`OKX HTTP ${res.status}`);
    const data = await res.json();
    const list = data?.data || [];

    return list.map(t => {
      const symbol = Object.keys(OKX_SYMBOL_MAP).find(k => OKX_SYMBOL_MAP[k] === t.instId) || t.instId;
      return {
        symbol,
        name: symbol.replace('USDT', ''),
        image: null,
        price: parseFloat(t.last) || 0,
        change24h: ((parseFloat(t.last) - parseFloat(t.open24h || t.last)) / parseFloat(t.open24h || t.last)) * 100 || 0,
        volume24h: parseFloat(t.vol24h) || 0,
        marketCap: null,
        high24h: parseFloat(t.high24h) || null,
        low24h: parseFloat(t.low24h) || null,
      };
    });
  }

  async fetchPrice(symbol) {
    const okxSymbol = OKX_SYMBOL_MAP[symbol];
    if (!okxSymbol) throw new Error(`OKX: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/market/ticker?instId=${okxSymbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`OKX HTTP ${res.status}`);
    const data = await res.json();
    const t = data?.data?.[0];
    if (!t) throw new Error('OKX: No data');

    return {
      symbol,
      price: parseFloat(t.last) || 0,
      change24h: ((parseFloat(t.last) - parseFloat(t.open24h || t.last)) / parseFloat(t.open24h || t.last)) * 100 || 0,
      high24h: parseFloat(t.high24h) || null,
      low24h: parseFloat(t.low24h) || null,
      volume24h: parseFloat(t.vol24h) || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const okxSymbol = OKX_SYMBOL_MAP[symbol];
    if (!okxSymbol) throw new Error(`OKX: No mapping for ${symbol}`);

    const barMap = {
      '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
      '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W',
    };
    const bar = barMap[interval] || '1H';

    const url = `${this.config.baseUrl}/market/candles?instId=${okxSymbol}&bar=${bar}&limit=${limit}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`OKX candles HTTP ${res.status}`);
    const data = await res.json();
    const list = data?.data || [];

    // OKX: [timestamp, open, high, low, close, vol, ...]
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
      const res = await this.timeout(fetch(`${this.config.baseUrl}/market/ticker?instId=BTC-USDT`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { OkxProvider };