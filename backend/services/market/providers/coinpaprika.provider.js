// services/market/providers/coinpaprika.provider.js
// ── COINPAPRIKA PROVIDER (free, no key, 25k req/month) ──

const { BaseProvider } = require('./base.provider');

const PAPRIKA_ID_MAP = {
  'BTCUSDT': 'btc-bitcoin',
  'ETHUSDT': 'eth-ethereum',
  'BNBUSDT': 'bnb-binance-coin',
  'SOLUSDT': 'sol-solana',
  'XRPUSDT': 'xrp-xrp',
  'ADAUSDT': 'ada-cardano',
  'DOGEUSDT': 'doge-dogecoin',
  'TRXUSDT': 'trx-tron',
  'MATICUSDT': 'matic-polygon',
  'DOTUSDT': 'dot-polkadot',
  'LTCUSDT': 'ltc-litecoin',
  'AVAXUSDT': 'avax-avalanche',
  'LINKUSDT': 'link-chainlink',
  'BCHUSDT': 'bch-bitcoin-cash',
  'UNIUSDT': 'uni-uniswap',
  'ATOMUSDT': 'atom-cosmos',
  'ETCUSDT': 'etc-ethereum-classic',
};

class CoinPaprikaProvider extends BaseProvider {
  get name() { return 'coinpaprika'; }

  get config() {
    return {
      name: 'coinpaprika',
      priority: 4,
      baseUrl: 'https://api.coinpaprika.com/v1',
      rateLimit: { requests: 50, windowMs: 60000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const url = `${this.config.baseUrl}/tickers?limit=100`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinPaprika HTTP ${res.status}`);
    const data = await res.json();

    return data
      .filter(t => {
        const id = t.id?.toLowerCase();
        return Object.values(PAPRIKA_ID_MAP).includes(id);
      })
      .map(t => {
        const q = t.quotes?.USD || {};
        const symbol = Object.keys(PAPRIKA_ID_MAP).find(
          k => PAPRIKA_ID_MAP[k] === t.id?.toLowerCase()
        ) || t.symbol?.toUpperCase();

        return {
          symbol,
          name: t.name || symbol,
          image: null,
          price: q.price || 0,
          change24h: q.percent_change_24h || 0,
          volume24h: q.volume_24h || 0,
          marketCap: q.market_cap || 0,
          high24h: null,
          low24h: null,
        };
      });
  }

  async fetchPrice(symbol) {
    const paprikaId = PAPRIKA_ID_MAP[symbol];
    if (!paprikaId) throw new Error(`CoinPaprika: No ID for ${symbol}`);

    const url = `${this.config.baseUrl}/tickers/${paprikaId}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinPaprika HTTP ${res.status}`);
    const d = await res.json();
    const q = d.quotes?.USD || {};

    return {
      symbol,
      price: q.price || 0,
      change24h: q.percent_change_24h || 0,
      high24h: null,
      low24h: null,
      volume24h: q.volume_24h || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    // CoinPaprika doesn't have a free OHLC endpoint — return empty
    return [];
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/tickers?limit=1`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { CoinPaprikaProvider };