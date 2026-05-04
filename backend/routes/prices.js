// routes/prices.js
// ── MARKETS ROUTES — delegates to new market.service system ──
// Backward-compatible: still mounts at /api/markets AND /api/prices

const express = require('express');
const router = express.Router();

// Lazy-load market service (new system)
let _svc = null;
function svc() {
  if (!_svc) {
    try { _svc = require('../services/market/market.service'); } catch (e) {
      console.warn('[prices.js] market.service unavailable:', e.message);
      _svc = null;
    }
  }
  return _svc;
}

// Lazy-load forex aggregator
let _fx = null;
function fx() {
  if (!_fx) {
    try { _fx = require('../services/forexAggregator'); } catch { _fx = null; }
  }
  return _fx;
}

const { BY_SYMBOL } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

// ── Crypto list ──
router.get('/list', async (req, res) => {
  try {
    const ms = svc();
    if (!ms) return res.status(503).json({ success: false, message: 'Market service unavailable' });
    const markets = await ms.getMarkets();
    // Normalize to expected format
    const rows = (markets || []).map(m => ({
      symbol:    m.symbol,
      name:      m.name || m.symbol.replace('USDT',''),
      price:     m.price || 0,
      change24h: m.change24h || 0,
      volume24h: m.volume24h || 0,
      high24h:   m.high24h || null,
      low24h:    m.low24h || null,
      marketCap: m.marketCap || null,
      iconUrl:   m.image || null,
    }));
    res.json({ rows, source: 'market-service', stale: false });
  } catch (err) {
    console.error('[prices] list error:', err.message);
    res.status(503).json({ success: false, message: 'Price feed temporarily unavailable' });
  }
});

// ── Forex list ──
router.get('/forex', async (req, res) => {
  try {
    const forexAgg = fx();
    if (!forexAgg) return res.status(503).json({ success: false, message: 'Forex feed unavailable' });
    const result = await forexAgg.getForexAndMetals();
    res.json({ ...result, rows: result.rows.filter(r => r.class === 'forex') });
  } catch (err) {
    console.error('[prices] forex error:', err.message);
    res.status(503).json({ success: false, message: 'Forex feed temporarily unavailable' });
  }
});

// ── Metals list ──
router.get('/metals', async (req, res) => {
  try {
    const forexAgg = fx();
    if (!forexAgg) return res.status(503).json({ success: false, message: 'Metals feed unavailable' });
    const result = await forexAgg.getForexAndMetals();
    res.json({ ...result, rows: result.rows.filter(r => r.class === 'metals') });
  } catch (err) {
    console.error('[prices] metals error:', err.message);
    res.status(503).json({ success: false, message: 'Metals feed temporarily unavailable' });
  }
});

// ── All markets unified ──
router.get('/all', async (req, res) => {
  try {
    const ms = svc();
    const forexAgg = fx();
    const [cryptoRes, fxRes] = await Promise.allSettled([
      ms ? ms.getMarkets() : Promise.resolve([]),
      forexAgg ? forexAgg.getForexAndMetals() : Promise.resolve({ rows: [] }),
    ]);
    const rows = [];
    if (cryptoRes.status === 'fulfilled') {
      rows.push(...(cryptoRes.value || []).map(m => ({ ...m, class: 'crypto' })));
    }
    if (fxRes.status === 'fulfilled') {
      rows.push(...(fxRes.value?.rows || []));
    }
    res.json({ rows, source: 'unified', stale: false });
  } catch (err) {
    console.error('[prices] all error:', err.message);
    res.status(503).json({ success: false, message: 'Feed temporarily unavailable' });
  }
});

// ── OHLC for any symbol ──
router.get('/:symbol/ohlc', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 1000);

    const ms = svc();
    if (!ms) return res.status(503).json({ success: false, message: 'OHLC unavailable' });

    const candles = await ms.getCandles(symbol, interval, limit);
    res.json({ candles: candles || [], source: 'market-service' });
  } catch (err) {
    console.error('[prices] ohlc error:', err.message);
    res.status(err.statusCode || 503).json({ success: false, message: err.message || 'OHLC unavailable' });
  }
});

// ── Single symbol ──
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const ms = svc();

    if (BY_SYMBOL[symbol]) {
      if (!ms) return res.status(503).json({ success: false, message: 'Feed unavailable' });
      const markets = await ms.getMarkets();
      const row = (markets || []).find(r => r.symbol === symbol);
      if (!row) {
        // Try price endpoint
        const price = await ms.getPrice(symbol);
        return res.json({ row: { symbol, price: price?.price, class: 'crypto' }, source: 'market-service', stale: false });
      }
      return res.json({ row: { ...row, class: 'crypto' }, source: 'market-service', stale: false });
    }

    if (FX_BY_SYMBOL[symbol] || METAL_BY_SYMBOL[symbol]) {
      const forexAgg = fx();
      if (!forexAgg) return res.status(503).json({ success: false, message: 'Feed unavailable' });
      const { rows, source, stale } = await forexAgg.getForexAndMetals();
      const row = rows.find(r => r.symbol === symbol);
      if (!row) return res.status(404).json({ success: false, message: 'Symbol not found' });
      return res.json({ row, source, stale });
    }

    return res.status(404).json({ success: false, message: `Unknown symbol: ${symbol}` });
  } catch (err) {
    console.error('[prices] one error:', err.message);
    res.status(503).json({ success: false, message: 'Feed temporarily unavailable' });
  }
});

module.exports = router;