// src/services/market/providers/coingecko.provider.js
// ── COINGECKO PROVIDER (free, no key, 30 req/min) ──

const { BaseProvider } = require('./base.provider');

const GECKO_ID_MAP = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'USDTUSDT': 'tether',
  'BNBUSDT': 'binancecoin',
  'SOLUSDT': 'solana',
  'XRPUSDT': 'ripple',
  'ADAUSDT': 'cardano',
  'DOGEUSDT': 'dogecoin',
  'TRXUSDT': 'tron',
  'MATICUSDT': 'matic-network',
  'DOTUSDT': 'polkadot',
  'LTCUSDT': 'litecoin',
  'AVAXUSDT': 'avalanche-2',
  'LINKUSDT': 'chainlink',
  'BCHUSDT': 'bitcoin-cash',
  'UNIUSDT': 'uniswap',
  'ATOMUSDT': 'cosmos',
  'ETCUSDT': 'ethereum-classic',
};

class CoinGeckoProvider extends BaseProvider {
  get name() { return 'coingecko'; }

  get config() {
    return {
      name: 'coingecko',
      priority: 3,
      baseUrl: 'https://api.coingecko.com/api/v3',
      rateLimit: { requests: 25, windowMs: 60000 },
      timeout: 10000,
    };
  }

  async fetchMarkets() {
    const ids = Object.values(GECKO_ID_MAP).join(',');
    const url = `${this.config.baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();

    return data.map(c => {
      const normalized = Object.keys(GECKO_ID_MAP).find(
        k => GECKO_ID_MAP[k] === c.id
      ) || c.symbol?.toUpperCase() + 'USDT';

      return {
        symbol: normalized,
        name: c.name,
        image: c.image,
        price: c.current_price || 0,
        change24h: c.price_change_percentage_24h || 0,
        volume24h: c.total_volume || 0,
        marketCap: c.market_cap || 0,
        high24h: c.high_24h || null,
        low24h: c.low_24h || null,
      };
    });
  }

  async fetchPrice(symbol) {
    const geckoId = GECKO_ID_MAP[symbol];
    if (!geckoId) throw new Error(`CoinGecko: No ID for ${symbol}`);

    const url = `${this.config.baseUrl}/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    const m = data.market_data || {};

    return {
      symbol,
      price: m.current_price?.usd || 0,
      change24h: m.price_change_percentage_24h || 0,
      high24h: m.high_24h?.usd || null,
      low24h: m.low_24h?.usd || null,
      volume24h: m.total_volume?.usd || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const geckoId = GECKO_ID_MAP[symbol];
    if (!geckoId) throw new Error(`CoinGecko: No ID for ${symbol}`);

    const dayMap = { '1m': 1, '5m': 1, '15m': 1, '30m': 7, '1h': 7, '4h': 30, '1d': 90, '1w': 365 };
    const days = dayMap[interval] || 7;

    const url = `${this.config.baseUrl}/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinGecko OHLC HTTP ${res.status}`);
    const raw = await res.json();

    if (!Array.isArray(raw)) return [];
    return raw.slice(-limit).map(k => ({
      time: Math.floor(k[0] / 1000),
      open: Number(k[1]) || 0,
      high: Number(k[2]) || 0,
      low: Number(k[3]) || 0,
      close: Number(k[4]) || 0,
      volume: 0,
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/ping`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { CoinGeckoProvider };