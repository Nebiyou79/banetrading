// services/providers/fxExchangerateHost.js
// ── EXCHANGERATE.HOST PROVIDER (forex + metals) ──

const { FOREX_PAIRS } = require('../../config/forex');
const { METAL_PAIRS } = require('../../config/metals');

const EHOST_BASE = 'https://api.exchangerate.host';
const FETCH_TIMEOUT_MS = 5000;

// ── Helpers ──
function invert(x) {
  if (!x || x === 0) return null;
  return 1 / x;
}

async function fetchJson(url, signal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`exchangerate.host ${res.status}`);
  return res.json();
}

// ── Main fetcher ──
async function fetchAll() {
  const symbols = 'EUR,GBP,JPY,CHF,AUD,XAU,XAG';
  const latestUrl = `${EHOST_BASE}/latest?base=USD&symbols=${symbols}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  try {
    const [latestData, yData] = await Promise.all([
      fetchJson(latestUrl, ctrl.signal),
      fetchYesterdayRates(symbols, ctrl.signal),
    ]);

    const r = latestData.rates || {};
    const yRates = yData || {};

    const out = [];

    // ── Forex pairs ──
    pushPair(out, 'EURUSD', invert(r.EUR), invert(yRates.EUR));
    pushPair(out, 'GBPUSD', invert(r.GBP), invert(yRates.GBP));
    pushPair(out, 'USDJPY', r.JPY, yRates.JPY);
    pushPair(out, 'USDCHF', r.CHF, yRates.CHF);
    pushPair(out, 'AUDUSD', invert(r.AUD), invert(yRates.AUD));

    // ── Metals ──
    pushPair(out, 'XAUUSD', invert(r.XAU), invert(yRates.XAU));
    pushPair(out, 'XAGUSD', invert(r.XAG), invert(yRates.XAG));

    return out;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYesterdayRates(symbols, signal) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  try {
    const data = await fetchJson(
      `${EHOST_BASE}/${yesterday}?base=USD&symbols=${symbols}`,
      signal,
    );
    return data.rates || {};
  } catch {
    return {}; // tolerate missing yesterday data
  }
}

function pushPair(out, symbol, price, prev) {
  if (price == null) return;
  let change24h = null;
  if (prev != null && prev > 0) {
    change24h = ((price - prev) / prev) * 100;
  }
  out.push({
    symbol,
    price,
    change24h,
    high24h: null,
    low24h: null,
    source: 'exchangerate.host',
  });
}

module.exports = { fetchAll };