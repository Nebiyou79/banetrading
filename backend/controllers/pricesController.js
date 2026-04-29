// controllers/pricesController.js
// ── MARKETS CONTROLLER (CRYPTO + FOREX + METALS) ──

const { getMarketList } = require('../services/priceAggregator');
const { getForexAndMetals } = require('../services/forexAggregator');
const { getOhlc } = require('../services/ohlcProvider');
const { BY_SYMBOL } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

// ── Crypto list (existing) ──
exports.list = async (req, res) => {
  try {
    const result = await getMarketList();
    res.json(result);
  } catch (err) {
    console.error('Markets list error:', err);
    res.status(503).json({ message: 'Price feed temporarily unavailable. Please retry.' });
  }
};

// ── Forex list ──
exports.forexList = async (req, res) => {
  try {
    const result = await getForexAndMetals();
    const forexOnly = { ...result, rows: result.rows.filter(r => r.class === 'forex') };
    res.json(forexOnly);
  } catch (err) {
    console.error('Forex list error:', err);
    res.status(503).json({ message: 'Forex feed temporarily unavailable.' });
  }
};

// ── Metals list ──
exports.metalsList = async (req, res) => {
  try {
    const result = await getForexAndMetals();
    const metalsOnly = { ...result, rows: result.rows.filter(r => r.class === 'metals') };
    res.json(metalsOnly);
  } catch (err) {
    console.error('Metals list error:', err);
    res.status(503).json({ message: 'Metals feed temporarily unavailable.' });
  }
};

// ── All markets unified ──
exports.allList = async (req, res) => {
  try {
    const [crypto, fx] = await Promise.allSettled([
      getMarketList(),
      getForexAndMetals(),
    ]);

    const rows = [];

    if (crypto.status === 'fulfilled') {
      rows.push(...crypto.value.rows.map(r => ({ ...r, class: 'crypto' })));
    }
    if (fx.status === 'fulfilled') {
      rows.push(...fx.value.rows);
    }

    const source = [
      crypto.status === 'fulfilled' ? crypto.value.source : null,
      fx.status === 'fulfilled' ? fx.value.source : null,
    ].filter(Boolean).join(' + ');

    const stale = (crypto.status === 'fulfilled' && crypto.value.stale) ||
                  (fx.status === 'fulfilled' && fx.value.stale);

    res.json({ rows, source: source || 'unknown', stale });
  } catch (err) {
    console.error('All markets error:', err);
    res.status(503).json({ message: 'Price feed temporarily unavailable.' });
  }
};

// ── Single symbol (auto-detect class) ──
exports.one = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    // ── Crypto ──
    if (BY_SYMBOL[symbol]) {
      const { rows, source, stale } = await getMarketList();
      const row = rows.find(r => r.symbol === symbol);
      if (!row) return res.status(404).json({ message: 'Symbol not in market list' });
      return res.json({ row: { ...row, class: 'crypto' }, source, stale });
    }

    // ── Forex or Metals ──
    if (FX_BY_SYMBOL[symbol] || METAL_BY_SYMBOL[symbol]) {
      const { rows, source, stale } = await getForexAndMetals();
      const row = rows.find(r => r.symbol === symbol);
      if (!row) return res.status(404).json({ message: 'Symbol not in market list' });
      return res.json({ row, source, stale });
    }

    return res.status(404).json({ message: 'Unknown symbol' });
  } catch (err) {
    console.error('Market one error:', err);
    res.status(503).json({ message: 'Price feed temporarily unavailable' });
  }
};

// ── OHLC (auto-detect class, reject sub-hourly FX) ──
exports.ohlc = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 500 } = req.query;
    const data = await getOhlc(symbol, interval, Math.min(parseInt(limit, 10) || 500, 1000));
    res.json(data);
  } catch (err) {
    console.error('OHLC error:', err);
    res.status(err.statusCode || 503).json({ message: err.message || 'Chart data unavailable' });
  }
};