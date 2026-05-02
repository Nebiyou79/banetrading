// src/services/market/providers/coingecko.provider.js
// ── COINGECKO PROVIDER (Images, metadata, fallback prices) ──

const { BaseProvider } = require('./base.provider');
const { BY_COINGECKO } = require('../symbols/symbol.map');

class CoinGeckoProvider extends BaseProvider {
  get name() {
    return 'coingecko';
  }

  get config() {
    return {
      name: 'coingecko',
      priority: 3,
      baseUrl: 'https://api.coingecko.com/api/v3',
      rateLimit: { requests: 30, windowMs: 60000 },
      timeout: 8000,
    };
  }

  async fetchMarkets() {
    const ids = Array.from(BY_COINGECKO.keys()).join(',');
    const url = `${this.config.baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    
    return data.map(c => {
      const normalized = BY_COINGECKO.get(c.id) || c.symbol.toUpperCase() + 'USDT';
      return {
        symbol: normalized,
        name: c.name,
        image: c.image,
        price: c.current_price,
        change24h: c.price_change_percentage_24h ?? 0,
        volume24h: c.total_volume,
        marketCap: c.market_cap,
        high24h: c.high_24h,
        low24h: c.low_24h,
      };
    });
  }

  async fetchPrice(symbol) {
    // Find CoinGecko ID for this symbol
    let geckoId = null;
    for (const [id, sym] of BY_COINGECKO.entries()) {
      if (sym === symbol) {
        geckoId = id;
        break;
      }
    }
    if (!geckoId) throw new Error(`CoinGecko: Unknown symbol ${symbol}`);
    
    return this.fetchByGeckoId(geckoId);
  }

  async fetchByGeckoId(geckoId) {
    const url = `${this.config.baseUrl}/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    const market = data.market_data;
    
    const normalized = BY_COINGECKO.get(geckoId) || data.symbol.toUpperCase() + 'USDT';
    
    return {
      symbol: normalized,
      price: market?.current_price?.usd ?? 0,
      change24h: market?.price_change_percentage_24h ?? 0,
      high24h: market?.high_24h?.usd,
      low24h: market?.low_24h?.usd,
      volume24h: market?.total_volume?.usd,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 500) {
    let geckoId = null;
    for (const [id, sym] of BY_COINGECKO.entries()) {
      if (sym === symbol) {
        geckoId = id;
        break;
      }
    }
    if (!geckoId) throw new Error(`CoinGecko: No CoinGecko ID for ${symbol}`);
    
    const dayMap = {
      '1m': 1, '5m': 1, '15m': 1,
      '30m': 7, '1h': 7, '4h': 30,
      '1d': 90, '1w': 365,
    };
    const days = dayMap[interval] || 7;
    
    const url = `${this.config.baseUrl}/coins/${geckoId}/ohlc?vs_currency=usd&days=${days}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    
    if (!res.ok) throw new Error(`CoinGecko OHLC HTTP ${res.status}`);
    const raw = await res.json();
    
    return raw.slice(-limit).map(k => ({
      time:   Math.floor(k[0] / 1000),
      open:   k[1],
      high:   k[2],
      low:    k[3],
      close:  k[4],
      volume: 0,
    }));
  }

  async healthCheck() {
    try {
      const res = await this.timeout(
        fetch(`${this.config.baseUrl}/ping`),
        3000
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}

module.exports = { CoinGeckoProvider };