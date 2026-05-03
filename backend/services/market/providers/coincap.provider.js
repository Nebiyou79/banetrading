// src/services/market/providers/coincap.provider.js
// ── COINCAP PROVIDER (free, no key, 200 req/min) ──

const { BaseProvider } = require('./base.provider');

// CoinCap ID overrides
const COINCAP_ID_MAP = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'USDTUSDT': 'tether',
  'BNBUSDT': 'binance-coin',
  'SOLUSDT': 'solana',
  'XRPUSDT': 'xrp',
  'ADAUSDT': 'cardano',
  'DOGEUSDT': 'dogecoin',
  'TRXUSDT': 'tron',
  'MATICUSDT': 'polygon',
  'DOTUSDT': 'polkadot',
  'LTCUSDT': 'litecoin',
  'AVAXUSDT': 'avalanche',
  'LINKUSDT': 'chainlink',
  'BCHUSDT': 'bitcoin-cash',
  'UNIUSDT': 'uniswap',
  'ATOMUSDT': 'cosmos',
  'ETCUSDT': 'ethereum-classic',
};

class CoinCapProvider extends BaseProvider {
  get name() { return 'coincap'; }

  get config() {
    return {
      name: 'coincap',
      priority: 2,
      baseUrl: 'https://api.coincap.io/v2',
      rateLimit: { requests: 200, windowMs: 60000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const url = `${this.config.baseUrl}/assets?limit=100`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinCap HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data || [];

    return data
      .filter(asset => {
        const id = asset.id?.toLowerCase();
        return Object.values(COINCAP_ID_MAP).includes(id);
      })
      .map(asset => {
        const symbol = Object.keys(COINCAP_ID_MAP).find(
          k => COINCAP_ID_MAP[k] === asset.id?.toLowerCase()
        ) || asset.symbol?.toUpperCase();

        return {
          symbol,
          name: asset.name || symbol,
          image: null,
          price: parseFloat(asset.priceUsd) || 0,
          change24h: parseFloat(asset.changePercent24Hr) || 0,
          volume24h: parseFloat(asset.volumeUsd24Hr) || 0,
          marketCap: parseFloat(asset.marketCapUsd) || 0,
          high24h: null,
          low24h: null,
        };
      });
  }

  async fetchPrice(symbol) {
    const coincapId = COINCAP_ID_MAP[symbol];
    if (!coincapId) throw new Error(`CoinCap: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/assets/${coincapId}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinCap HTTP ${res.status}`);
    const json = await res.json();
    const d = json.data || {};

    return {
      symbol,
      price: parseFloat(d.priceUsd) || 0,
      change24h: parseFloat(d.changePercent24Hr) || 0,
      high24h: null,
      low24h: null,
      volume24h: parseFloat(d.volumeUsd24Hr) || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const coincapId = COINCAP_ID_MAP[symbol];
    if (!coincapId) throw new Error(`CoinCap: No mapping for ${symbol}`);

    const intervalMap = {
      '1m': 'm1', '5m': 'm5', '15m': 'm15',
      '1h': 'h1', '4h': 'h4', '1d': 'd1', '1w': 'd1',
    };
    const mapped = intervalMap[interval] || 'h1';

    const intervalMs = { m1: 60000, m5: 300000, m15: 900000, h1: 3600000, h4: 14400000, d1: 86400000 };
    const msBack = (intervalMs[mapped] || 86400000) * limit;
    const start = Date.now() - msBack;
    const end = Date.now();

    const url = `${this.config.baseUrl}/assets/${coincapId}/history?interval=${mapped}&start=${start}&end=${end}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinCap HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data || [];
    if (data.length === 0) return [];

    return data
      .filter(d => d.priceUsd && d.time)
      .map(d => ({
        time: Math.floor(d.time / 1000),
        open: parseFloat(d.priceUsd),
        high: parseFloat(d.priceUsd),
        low: parseFloat(d.priceUsd),
        close: parseFloat(d.priceUsd),
        volume: parseFloat(d.volume || 0),
      }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/assets?limit=1`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { CoinCapProvider };