// services/market/providers/bitfinex.provider.js
// ── BITFINEX PROVIDER (free, no key, 30 req/min) ──
// Symbol format: tBTCUST (t prefix + BASE + UST for USDT pairs)
// Docs: https://docs.bitfinex.com/reference/rest-public-ticker

const { BaseProvider } = require('./base.provider');

// Bitfinex uses 't' prefix and 'UST' for USDT pairs
const BITFINEX_SYMBOL_MAP = {
  'BTCUSDT':  'tBTCUST',
  'ETHUSDT':  'tETHUST',
  'BNBUSDT':  'tBNBUST',
  'SOLUSDT':  'tSOLUST',
  'XRPUSDT':  'tXRPUST',
  'ADAUSDT':  'tADAUST',
  'DOGEUSDT': 'tDOGEUST',
  'TRXUSDT':  'tTRXUST',
  'MATICUSDT':'tMATICUST',
  'DOTUSDT':  'tDOTUST',
  'LTCUSDT':  'tLTCUST',
  'AVAXUSDT': 'tAVAXUST',
  'LINKUSDT': 'tLINKUST',
  'BCHUSDT':  'tBCHUST',
  'UNIUSDT':  'tUNIUST',
  'ATOMUSDT': 'tATOMUST',
  'ETCUSDT':  'tETCUST',
};

// Reverse map for fetchMarkets
const BITFINEX_REVERSE_MAP = Object.fromEntries(
  Object.entries(BITFINEX_SYMBOL_MAP).map(([k, v]) => [v, k])
);

// Interval map for Bitfinex candles
const INTERVAL_MAP = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '4h': '4h', '1d': '1D', '1w': '7D',
};

class BitfinexProvider extends BaseProvider {
  get name() { return 'bitfinex'; }

  get config() {
    return {
      name: 'bitfinex',
      priority: 6,
      baseUrl: 'https://api-pub.bitfinex.com/v2',
      rateLimit: { requests: 30, windowMs: 60000 },
      timeout: 6000,
    };
  }

  async fetchMarkets() {
    const symbols = Object.values(BITFINEX_SYMBOL_MAP).join(',');
    const url = `${this.config.baseUrl}/tickers?symbols=${symbols}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Bitfinex markets HTTP ${res.status}`);
    const data = await res.json();

    // Bitfinex ticker array: [SYMBOL, BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_RELATIVE, LAST_PRICE, VOLUME, HIGH, LOW]
    return data
      .filter(t => BITFINEX_REVERSE_MAP[t[0]])
      .map(t => {
        const ourSymbol = BITFINEX_REVERSE_MAP[t[0]];
        return {
          symbol:    ourSymbol,
          name:      ourSymbol.replace('USDT', ''),
          image:     null,
          price:     parseFloat(t[7]) || 0,
          change24h: parseFloat(t[6]) * 100 || 0,   // daily_change_relative is a ratio
          volume24h: parseFloat(t[8]) || 0,
          marketCap: null,
          high24h:   parseFloat(t[9]) || null,
          low24h:    parseFloat(t[10]) || null,
        };
      });
  }

  async fetchPrice(symbol) {
    const bfxSymbol = BITFINEX_SYMBOL_MAP[symbol];
    if (!bfxSymbol) throw new Error(`Bitfinex: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/ticker/${bfxSymbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Bitfinex price HTTP ${res.status}`);
    const t = await res.json();

    // [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_RELATIVE, LAST_PRICE, VOLUME, HIGH, LOW]
    if (!Array.isArray(t) || t.length < 10) throw new Error('Bitfinex: Invalid ticker response');

    return {
      symbol,
      price:     parseFloat(t[6]) || 0,
      change24h: parseFloat(t[5]) * 100 || 0,
      high24h:   parseFloat(t[8]) || null,
      low24h:    parseFloat(t[9]) || null,
      volume24h: parseFloat(t[7]) || 0,
      timestamp: Date.now(),
      provider:  this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 300) {
    const bfxSymbol = BITFINEX_SYMBOL_MAP[symbol];
    if (!bfxSymbol) throw new Error(`Bitfinex: No mapping for ${symbol}`);

    const bfxInterval = INTERVAL_MAP[interval] || '1h';
    const url = `${this.config.baseUrl}/candles/trade:${bfxInterval}:${bfxSymbol}/hist?limit=${Math.min(limit, 1000)}&sort=1`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Bitfinex candles HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return [];

    // Bitfinex candle: [MTS, OPEN, CLOSE, HIGH, LOW, VOLUME]
    return data.map(k => ({
      time:   Math.floor(parseFloat(k[0]) / 1000), // MTS is milliseconds
      open:   parseFloat(k[1]) || 0,
      close:  parseFloat(k[2]) || 0,
      high:   parseFloat(k[3]) || 0,
      low:    parseFloat(k[4]) || 0,
      volume: parseFloat(k[5]) || 0,
    })).filter(c => c.time > 0 && c.open > 0 && c.high >= c.low);
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/ticker/tBTCUST`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { BitfinexProvider };
