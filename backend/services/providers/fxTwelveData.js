// services/providers/fxTwelveData.js
// ── TWELVE DATA PROVIDER (forex + metals quotes + OHLC) ──

const { FOREX_PAIRS } = require('../../config/forex');
const { METAL_PAIRS } = require('../../config/metals');

const TWELVEDATA_BASE = 'https://api.twelvedata.com';
const FETCH_TIMEOUT_MS = 5000;

function getApiKey() {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) throw new Error('TWELVEDATA_API_KEY not set');
  return key;
}

// ── Twelve Data symbol format uses slash ──
function toTwelveSymbol(symbol) {
  if (typeof symbol !== 'string') return symbol;
  // EURUSD → EUR/USD, XAUUSD → XAU/USD
  if (symbol.length === 6) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  return symbol;
}

// ── Quote fetcher ──
async function fetchAll() {
  const key = getApiKey();
  const allPairs = [...FOREX_PAIRS, ...METAL_PAIRS];
  const symbols = allPairs.map(p => toTwelveSymbol(p.symbol)).join(',');

  const url = `${TWELVEDATA_BASE}/quote?symbol=${symbols}&apikey=${key}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`twelvedata quote ${res.status}`);
    const data = await res.json();

    // ── Twelve Data returns a single object or an array if multiple symbols ──
    const items = Array.isArray(data) ? data : [data];
    const bySym = {};
    for (const item of items) {
      if (item.symbol) {
        // Reverse mapping: EUR/USD → EURUSD
        const raw = item.symbol.replace('/', '');
        bySym[raw] = item;
      }
    }

    return allPairs.map(p => {
      const item = bySym[p.symbol];
      if (!item) return null;
      return {
        symbol:    p.symbol,
        price:     parseFloat(item.close) || null,
        change24h: parseFloat(item.percent_change) || null,
        high24h:   parseFloat(item.high) || null,
        low24h:    parseFloat(item.low) || null,
        source:    'twelvedata',
      };
    }).filter(Boolean);
  } finally {
    clearTimeout(timer);
  }
}

// ── OHLC fetcher ──
async function fetchOhlc(symbol, interval, limit = 500) {
  const key = getApiKey();
  const tdSymbol = toTwelveSymbol(symbol);

  const intervalMap = {
    '1h': '1h',
    '4h': '4h',
    '1d': '1day',
    '1w': '1week',
  };

  const tdInterval = intervalMap[interval];
  if (!tdInterval) {
    throw new Error(`Twelve Data does not support interval: ${interval}`);
  }

  const url = `${TWELVEDATA_BASE}/time_series?symbol=${tdSymbol}&interval=${tdInterval}&outputsize=${limit}&apikey=${key}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`twelvedata ohlc ${res.status}`);
    const data = await res.json();

    if (data.status === 'error') {
      throw new Error(`twelvedata error: ${data.message}`);
    }

    const values = data.values || [];
    // ── Twelve Data returns newest-first; reverse to chrono order ──
    return values.reverse().map(v => ({
      time:   Math.floor(new Date(v.datetime).getTime() / 1000),
      open:   parseFloat(v.open),
      high:   parseFloat(v.high),
      low:    parseFloat(v.low),
      close:  parseFloat(v.close),
      volume: 0,
    }));
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchAll, fetchOhlc };