// src/services/market/providers/gateio.provider.js
// ── GATE.IO PROVIDER (free, no key, 200 req/sec) ──
// API: https://api.gateio.ws/api/v4
// Docs: https://www.gate.io/docs/developers/apiv4/

const { BaseProvider } = require('./base.provider');

const GATE_SYMBOL_MAP = {
  'BTCUSDT': 'BTC_USDT',
  'ETHUSDT': 'ETH_USDT',
  'BNBUSDT': 'BNB_USDT',
  'SOLUSDT': 'SOL_USDT',
  'XRPUSDT': 'XRP_USDT',
  'ADAUSDT': 'ADA_USDT',
  'DOGEUSDT': 'DOGE_USDT',
  'TRXUSDT': 'TRX_USDT',
  'MATICUSDT': 'MATIC_USDT',
  'DOTUSDT': 'DOT_USDT',
  'LTCUSDT': 'LTC_USDT',
  'AVAXUSDT': 'AVAX_USDT',
  'LINKUSDT': 'LINK_USDT',
  'BCHUSDT': 'BCH_USDT',
  'UNIUSDT': 'UNI_USDT',
  'ATOMUSDT': 'ATOM_USDT',
  'ETCUSDT': 'ETC_USDT',
};

class GateIoProvider extends BaseProvider {
  get name() { return 'gateio'; }

  get config() {
    return {
      name: 'gateio',
      priority: 7,
      baseUrl: 'https://api.gateio.ws/api/v4',
      rateLimit: { requests: 200, windowMs: 1000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const pairs = Object.values(GATE_SYMBOL_MAP).join(',');
    const url = `${this.config.baseUrl}/spot/tickers?currency_pair=${pairs}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Gate.io HTTP ${res.status}`);
    const data = await res.json();

    return data.map(t => {
      const symbol = Object.keys(GATE_SYMBOL_MAP).find(k => GATE_SYMBOL_MAP[k] === t.currency_pair) || t.currency_pair;
      return {
        symbol,
        name: symbol.replace('USDT', ''),
        image: null,
        price: parseFloat(t.last) || 0,
        change24h: parseFloat(t.change_percentage) || 0,
        volume24h: parseFloat(t.quote_volume) || 0,
        marketCap: null,
        high24h: parseFloat(t.high_24h) || null,
        low24h: parseFloat(t.low_24h) || null,
      };
    });
  }

  async fetchPrice(symbol) {
    const gateSymbol = GATE_SYMBOL_MAP[symbol];
    if (!gateSymbol) throw new Error(`Gate.io: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/spot/tickers?currency_pair=${gateSymbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Gate.io HTTP ${res.status}`);
    const t = await res.json();
    const ticker = Array.isArray(t) ? t[0] : t;
    if (!ticker) throw new Error('Gate.io: No data');

    return {
      symbol,
      price: parseFloat(ticker.last) || 0,
      change24h: parseFloat(ticker.change_percentage) || 0,
      high24h: parseFloat(ticker.high_24h) || null,
      low24h: parseFloat(ticker.low_24h) || null,
      volume24h: parseFloat(ticker.quote_volume) || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const gateSymbol = GATE_SYMBOL_MAP[symbol];
    if (!gateSymbol) throw new Error(`Gate.io: No mapping for ${symbol}`);

    const secMap = {
      '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
      '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
    };
    const intervalSec = secMap[interval] || 3600;
    const from = Math.floor(Date.now() / 1000) - (intervalSec * limit);
    const to = Math.floor(Date.now() / 1000);

    const url = `${this.config.baseUrl}/spot/candlesticks?currency_pair=${gateSymbol}&interval=${intervalSec}&from=${from}&to=${to}&limit=${limit}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Gate.io candles HTTP ${res.status}`);
    const data = await res.json();

    // Gate.io: [timestamp, volume, close, high, low, open, amount]
    return data.map(k => ({
      time: Math.floor(parseFloat(k[0])),
      open: parseFloat(k[5]) || 0,
      high: parseFloat(k[3]) || 0,
      low: parseFloat(k[4]) || 0,
      close: parseFloat(k[2]) || 0,
      volume: parseFloat(k[1]) || 0,
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/spot/tickers?currency_pair=BTC_USDT`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { GateIoProvider };