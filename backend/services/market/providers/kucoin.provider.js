// src/services/market/providers/kucoin.provider.js
// ── KUCOIN PROVIDER (free, no key for public endpoints) ──
// API: https://api.kucoin.com/api/v1
// Docs: https://docs.kucoin.com/

const { BaseProvider } = require('./base.provider');

const KUCOIN_SYMBOL_MAP = {
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

class KuCoinProvider extends BaseProvider {
  get name() { return 'kucoin'; }

  get config() {
    return {
      name: 'kucoin',
      priority: 8,
      baseUrl: 'https://api.kucoin.com/api/v1',
      rateLimit: { requests: 100, windowMs: 10000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const url = `${this.config.baseUrl}/market/allTickers`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`KuCoin HTTP ${res.status}`);
    const data = await res.json();
    const tickers = data?.data?.ticker || [];

    return tickers
      .filter(t => Object.values(KUCOIN_SYMBOL_MAP).includes(t.symbol))
      .map(t => {
        const symbol = Object.keys(KUCOIN_SYMBOL_MAP).find(k => KUCOIN_SYMBOL_MAP[k] === t.symbol) || t.symbol;
        return {
          symbol,
          name: symbol.replace('USDT', ''),
          image: null,
          price: parseFloat(t.last) || 0,
          change24h: parseFloat(t.changeRate) * 100 || 0,
          volume24h: parseFloat(t.volValue) || 0,
          marketCap: null,
          high24h: parseFloat(t.high) || null,
          low24h: parseFloat(t.low) || null,
        };
      });
  }

  async fetchPrice(symbol) {
    const kucoinSymbol = KUCOIN_SYMBOL_MAP[symbol];
    if (!kucoinSymbol) throw new Error(`KuCoin: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/market/orderbook/level1?symbol=${kucoinSymbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`KuCoin HTTP ${res.status}`);
    const data = await res.json();
    const d = data?.data;
    if (!d) throw new Error('KuCoin: No data');

    const url2 = `${this.config.baseUrl}/market/stats?symbol=${kucoinSymbol}`;
    let change24h = 0;
    let high24h = null;
    let low24h = null;
    try {
      const res2 = await this.timeout(fetch(url2), 3000);
      if (res2.ok) {
        const stats = await res2.json();
        const s = stats?.data;
        if (s) {
          change24h = parseFloat(s.changeRate) * 100 || 0;
          high24h = parseFloat(s.high) || null;
          low24h = parseFloat(s.low) || null;
        }
      }
    } catch {}

    return {
      symbol,
      price: parseFloat(d.price) || 0,
      change24h,
      high24h,
      low24h,
      volume24h: parseFloat(d.volValue) || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const kucoinSymbol = KUCOIN_SYMBOL_MAP[symbol];
    if (!kucoinSymbol) throw new Error(`KuCoin: No mapping for ${symbol}`);

    const typeMap = {
      '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
      '1h': '1hour', '4h': '4hour', '1d': '1day', '1w': '1week',
    };
    const kucoinInterval = typeMap[interval] || '1hour';

    const url = `${this.config.baseUrl}/market/candles?type=${kucoinInterval}&symbol=${kucoinSymbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`KuCoin candles HTTP ${res.status}`);
    const data = await res.json();
    const list = data?.data || [];

    // KuCoin: [timestamp, open, close, high, low, volume, turnover]
    return list.slice(0, limit).reverse().map(k => ({
      time: Math.floor(parseFloat(k[0])),
      open: parseFloat(k[1]) || 0,
      high: parseFloat(k[3]) || 0,
      low: parseFloat(k[4]) || 0,
      close: parseFloat(k[2]) || 0,
      volume: parseFloat(k[5]) || 0,
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/status`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { KuCoinProvider };