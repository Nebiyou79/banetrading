// services/market/providers/cryptocompare.provider.js
// ── CRYPTOCOMPARE PROVIDER (free, no key, 100k calls/month) ──

const { BaseProvider } = require('./base.provider');

const CC_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE',
  'TRX', 'MATIC', 'DOT', 'LTC', 'AVAX', 'LINK', 'BCH',
  'UNI', 'ATOM', 'ETC',
];

class CryptoCompareProvider extends BaseProvider {
  get name() { return 'cryptocompare'; }

  get config() {
    return {
      name: 'cryptocompare',
      priority: 6,
      baseUrl: 'https://min-api.cryptocompare.com/data',
      rateLimit: { requests: 50, windowMs: 60000 },
      timeout: 5000,
    };
  }

  async fetchMarkets() {
    const symbols = CC_SYMBOLS.join(',');
    const url = `${this.config.baseUrl}/pricemultifull?fsyms=${symbols}&tsyms=USD`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CryptoCompare HTTP ${res.status}`);
    const json = await res.json();
    const raw = json.RAW || {};

    return CC_SYMBOLS.map(sym => {
      const d = raw[sym]?.USD;
      if (!d) return null;
      return {
        symbol: sym + 'USDT',
        name: sym,
        image: `https://www.cryptocompare.com${d.IMAGEURL || ''}`,
        price: d.PRICE || 0,
        change24h: d.CHANGEPCT24HOUR || 0,
        volume24h: d.VOLUME24HOUR || 0,
        marketCap: d.MKTCAP || 0,
        high24h: d.HIGH24HOUR || null,
        low24h: d.LOW24HOUR || null,
      };
    }).filter(Boolean);
  }

  async fetchPrice(symbol) {
    const sym = symbol.replace('USDT', '');
    const url = `${this.config.baseUrl}/pricemultifull?fsyms=${sym}&tsyms=USD`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CryptoCompare HTTP ${res.status}`);
    const json = await res.json();
    const d = json.RAW?.[sym]?.USD;
    if (!d) throw new Error(`CryptoCompare: No data for ${sym}`);

    return {
      symbol,
      price: d.PRICE || 0,
      change24h: d.CHANGEPCT24HOUR || 0,
      high24h: d.HIGH24HOUR || null,
      low24h: d.LOW24HOUR || null,
      volume24h: d.VOLUME24HOUR || 0,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    const sym = symbol.replace('USDT', '');
    const endpointMap = {
      '1m': 'histominute', '5m': 'histominute', '15m': 'histominute',
      '1h': 'histohour', '4h': 'histohour', '1d': 'histoday', '1w': 'histoday',
    };
    const aggregateMap = {
      '1m': 1, '5m': 5, '15m': 15, '1h': 1, '4h': 4, '1d': 1, '1w': 7,
    };

    const endpoint = endpointMap[interval] || 'histohour';
    const aggregate = aggregateMap[interval] || 1;
    const url = `${this.config.baseUrl}/v2/${endpoint}?fsym=${sym}&tsym=USD&limit=${Math.min(limit, 2000)}&aggregate=${aggregate}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CryptoCompare HTTP ${res.status}`);
    const json = await res.json();
    const data = json.Data?.Data || [];
    if (data.length === 0) return [];

    return data.map(d => ({
      time: d.time,
      open: d.open || 0,
      high: d.high || 0,
      low: d.low || 0,
      close: d.close || 0,
      volume: d.volumeto || 0,
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/price?fsym=BTC&tsyms=USD`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { CryptoCompareProvider };