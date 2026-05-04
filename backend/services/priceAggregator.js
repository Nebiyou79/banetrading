// controllers/pricesController.js
// ── MARKETS CONTROLLER (CRYPTO + FOREX + METALS) ──
// Updated to use new market aggregator system with fallback

const { BY_SYMBOL } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

// ── Lazy-load aggregators ──
let _priceAggregator = null;
let _forexAggregator = null;
let _marketService = null;
let _ohlcProvider = null;

function getPriceAggregator() {
  if (!_priceAggregator) {
    try {
      _priceAggregator = require('../services/priceAggregator');
    } catch {
      _priceAggregator = null;
    }
  }
  return _priceAggregator;
}

function getForexAggregator() {
  if (!_forexAggregator) {
    try {
      _forexAggregator = require('../services/forexAggregator');
    } catch {
      _forexAggregator = null;
    }
  }
  return _forexAggregator;
}

function getMarketService() {
  if (!_marketService) {
    try {
      _marketService = require('../services/market/market.service');
    } catch {
      _marketService = null;
    }
  }
  return _marketService;
}

function getOhlcProvider() {
  if (!_ohlcProvider) {
    try {
      _ohlcProvider = require('../services/ohlcProvider');
    } catch {
      _ohlcProvider = null;
    }
  }
  return _ohlcProvider;
}

// ── Crypto list ──
exports.list = async (req, res) => {
  try {
    const priceAgg = getPriceAggregator();
    if (!priceAgg) {
      return res.status(503).json({ message: 'Price feed temporarily unavailable.' });
    }
    const result = await priceAgg.getMarketList();
    res.json(result);
  } catch (err) {
    console.error('Markets list error:', err);
    res.status(503).json({ message: 'Price feed temporarily unavailable. Please retry.' });
  }
};

// ── Forex list ──
exports.forexList = async (req, res) => {
  try {
    const forexAgg = getForexAggregator();
    if (!forexAgg) {
      return res.status(503).json({ message: 'Forex feed temporarily unavailable.' });
    }
    const result = await forexAgg.getForexAndMetals();
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
    const forexAgg = getForexAggregator();
    if (!forexAgg) {
      return res.status(503).json({ message: 'Metals feed temporarily unavailable.' });
    }
    const result = await forexAgg.getForexAndMetals();
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
    const priceAgg = getPriceAggregator();
    const forexAgg = getForexAggregator();

    const promises = [];
    if (priceAgg) promises.push(priceAgg.getMarketList());
    else promises.push(Promise.resolve({ rows: [], source: 'none', stale: true }));

    if (forexAgg) promises.push(forexAgg.getForexAndMetals());
    else promises.push(Promise.resolve({ rows: [], source: 'none', stale: true }));

    const [crypto, fx] = await Promise.allSettled(promises);

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
      const priceAgg = getPriceAggregator();
      if (!priceAgg) return res.status(503).json({ message: 'Feed unavailable' });
      const { rows, source, stale } = await priceAgg.getMarketList();
      const row = rows.find(r => r.symbol === symbol);
      if (!row) return res.status(404).json({ message: 'Symbol not in market list' });
      return res.json({ row: { ...row, class: 'crypto' }, source, stale });
    }

    // ── Forex or Metals ──
    if (FX_BY_SYMBOL[symbol] || METAL_BY_SYMBOL[symbol]) {
      const forexAgg = getForexAggregator();
      if (!forexAgg) return res.status(503).json({ message: 'Feed unavailable' });
      const { rows, source, stale } = await forexAgg.getForexAndMetals();
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

// ── OHLC (auto-detect class) ──
exports.ohlc = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 500 } = req.query;

    // Try new market service first
    const marketService = getMarketService();
    if (marketService) {
      try {
        const candles = await marketService.getCandles(symbol, interval, Math.min(parseInt(limit, 10) || 500, 1000));
        return res.json({ candles, source: 'market-service' });
      } catch (err) {
        console.warn('[pricesController] market service candles failed:', err.message);
      }
    }

    // Fall back to old ohlcProvider
    const ohlc = getOhlcProvider();
    if (ohlc) {
      const data = await ohlc.getOhlc(symbol, interval, Math.min(parseInt(limit, 10) || 500, 1000));
      return res.json(data);
    }

    res.status(503).json({ message: 'Chart data unavailable' });
  } catch (err) {
    console.error('OHLC error:', err);
    res.status(err.statusCode || 503).json({ message: err.message || 'Chart data unavailable' });
  }
};