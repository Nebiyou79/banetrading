// services/market/providers/huobi.provider.js
// ── HUOBI / HTX PROVIDER (free, no key, 10 req/sec) ──
// Symbol format: lowercase (btcusdt, ethusdt, etc.)
// Docs: https://huobiapi.github.io/docs/spot/v1/en/

const { BaseProvider } = require('./base.provider');

// Huobi uses lowercase symbols
const HUOBI_SYMBOL_MAP = {
  'BTCUSDT':  'btcusdt',
  'ETHUSDT':  'ethusdt',
  'BNBUSDT':  'bnbusdt',
  'SOLUSDT':  'solusdt',
  'XRPUSDT':  'xrpusdt',
  'ADAUSDT':  'adausdt',
  'DOGEUSDT': 'dogeusdt',
  'TRXUSDT':  'trxusdt',
  'MATICUSDT':'maticusdt',
  'DOTUSDT':  'dotusdt',
  'LTCUSDT':  'ltcusdt',
  'AVAXUSDT': 'avaxusdt',
  'LINKUSDT': 'linkusdt',
  'BCHUSDT':  'bchusdt',
  'UNIUSDT':  'uniusdt',
  'ATOMUSDT': 'atomusdt',
  'ETCUSDT':  'etcusdt',
};

const HUOBI_REVERSE_MAP = Object.fromEntries(
  Object.entries(HUOBI_SYMBOL_MAP).map(([k, v]) => [v, k])
);

// Interval map for Huobi candles
const INTERVAL_MAP = {
  '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
  '1h': '60min', '4h': '4hour', '1d': '1day', '1w': '1week',
};

class HuobiProvider extends BaseProvider {
  get name() { return 'huobi'; }

  get config() {
    return {
      name: 'huobi',
      priority: 5,
      baseUrl: 'https://api.huobi.pro',
      rateLimit: { requests: 10, windowMs: 1000 },
      timeout: 6000,
    };
  }

  async fetchMarkets() {
    // Fetch all tickers in one call, then filter
    const url = `${this.config.baseUrl}/market/tickers`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Huobi markets HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Huobi markets: ${data['err-msg'] || 'bad response'}`);

    const tickers = data.data || [];
    return tickers
      .filter(t => HUOBI_REVERSE_MAP[t.symbol])
      .map(t => {
        const ourSymbol = HUOBI_REVERSE_MAP[t.symbol];
        const close = parseFloat(t.close) || 0;
        const open  = parseFloat(t.open) || 0;
        const change24h = open > 0 ? ((close - open) / open) * 100 : 0;
        return {
          symbol:    ourSymbol,
          name:      ourSymbol.replace('USDT', ''),
          image:     null,
          price:     close,
          change24h: +change24h.toFixed(2),
          volume24h: parseFloat(t.vol) || 0,
          marketCap: null,
          high24h:   parseFloat(t.high) || null,
          low24h:    parseFloat(t.low) || null,
        };
      });
  }

  async fetchPrice(symbol) {
    const huobiSymbol = HUOBI_SYMBOL_MAP[symbol];
    if (!huobiSymbol) throw new Error(`Huobi: No mapping for ${symbol}`);

    const url = `${this.config.baseUrl}/market/detail/merged?symbol=${huobiSymbol}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Huobi price HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Huobi price: ${data['err-msg'] || 'bad response'}`);

    const tick = data.tick;
    const close = parseFloat(tick.close) || 0;
    const open  = parseFloat(tick.open) || 0;
    const change24h = open > 0 ? ((close - open) / open) * 100 : 0;

    return {
      symbol,
      price:     close,
      change24h: +change24h.toFixed(2),
      high24h:   parseFloat(tick.high) || null,
      low24h:    parseFloat(tick.low) || null,
      volume24h: parseFloat(tick.vol) || 0,
      timestamp: Date.now(),
      provider:  this.name,
    };
  }

  async fetchCandles(symbol, interval, limit = 300) {
    const huobiSymbol = HUOBI_SYMBOL_MAP[symbol];
    if (!huobiSymbol) throw new Error(`Huobi: No mapping for ${symbol}`);

    const huobiInterval = INTERVAL_MAP[interval] || '60min';
    const url = `${this.config.baseUrl}/market/history/kline?symbol=${huobiSymbol}&period=${huobiInterval}&size=${Math.min(limit, 2000)}`;
    const res = await this.timeout(fetch(url), this.config.timeout);
    if (!res.ok) throw new Error(`Huobi candles HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Huobi candles: ${data['err-msg'] || 'bad response'}`);

    const list = data.data || [];

    // Huobi returns newest first — reverse for chronological order
    // Huobi candle: { id (unix ts), open, close, high, low, vol, amount, count }
    return list.reverse().map(k => ({
      time:   Math.floor(parseFloat(k.id)),
      open:   parseFloat(k.open) || 0,
      high:   parseFloat(k.high) || 0,
      low:    parseFloat(k.low) || 0,
      close:  parseFloat(k.close) || 0,
      volume: parseFloat(k.vol) || 0,
    })).filter(c => c.time > 0 && c.open > 0 && c.high >= c.low);
  }

  async healthCheck() {
    try {
      const res = await this.timeout(fetch(`${this.config.baseUrl}/market/detail/merged?symbol=btcusdt`), 3000);
      return res.ok;
    } catch { return false; }
  }
}

module.exports = { HuobiProvider };
