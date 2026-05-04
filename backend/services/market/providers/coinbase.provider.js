// services/market/providers/coinbase.provider.js
// ── COINBASE PROVIDER (free, no key, 10 req/sec) ──
// API: https://api.coinbase.com/v2
// Docs: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-prices

const { BaseProvider } = require('./base.provider');

const COINBASE_ID_MAP = {
  'BTCUSDT': 'BTC-USD',
  'ETHUSDT': 'ETH-USD',
  'SOLUSDT': 'SOL-USD',
  'XRPUSDT': 'XRP-USD',
  'ADAUSDT': 'ADA-USD',
  'DOGEUSDT': 'DOGE-USD',
  'DOTUSDT': 'DOT-USD',
  'LTCUSDT': 'LTC-USD',
  'LINKUSDT': 'LINK-USD',
  'AVAXUSDT': 'AVAX-USD',
  'BCHUSDT': 'BCH-USD',
  'MATICUSDT': 'MATIC-USD',
  'UNIUSDT': 'UNI-USD',
  'ATOMUSDT': 'ATOM-USD',
  'ETCUSDT': 'ETC-USD',
};

class CoinbaseProvider extends BaseProvider {
  get name() { return 'coinbase'; }

  get config() {
    return {
      name: 'coinbase',
      priority: 6,
      baseUrl: 'https://api.coinbase.com/v2',
      rateLimit: { requests: 10, windowMs: 1000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    // Coinbase doesn't have a single "all markets" endpoint — fetch individually
    const pairs = Object.values(COINBASE_ID_MAP);
    const results = [];

    for (const pair of pairs) {
      try {
        const url = `${this.config.baseUrl}/prices/${pair}/spot`;
        const res = await this.timeout(fetch(url), this.config.timeout);
        if (!res.ok) continue;
        const d = await res.json();
        const data = d.data || {};
        const symbol = Object.keys(COINBASE_ID_MAP).find(k => COINBASE_ID_MAP[k] === pair) || pair;

        results.push({
          symbol,
          name: symbol.replace('USDT', ''),
          image: null,
          price: parseFloat(data.amount) || 0,
          change24h: null,
          volume24h: null,
          marketCap: null,
          high24h: null,
          low24h: null,
        });
      } catch {}
    }
    return results;
  }

  async fetchPrice(symbol) {
    const pair = COINBASE_ID_MAP[symbol];
    if (!pair) throw new Error(`Coinbase: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/prices/${pair}/spot`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Coinbase HTTP ${res.status}`);
    const d = await res.json();
    const data = d.data || {};

    return {
      symbol,
      price: parseFloat(data.amount) || 0,
      change24h: null,
      high24h: null,
      low24h: null,
      volume24h: null,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    // Coinbase doesn't have a free OHLC endpoint — return empty
    return [];
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/prices/BTC-USD/spot`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { CoinbaseProvider };