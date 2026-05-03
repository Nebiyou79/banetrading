// src/controllers/market.controller.js
// ── MARKET CONTROLLER (FIXED: real candles, proper OHLC format) ──

const marketService = require('../services/market/market.service');

/**
 * GET /api/chart?symbol=BTCUSDT&interval=1h&limit=300
 * GET /api/market/chart/:symbol
 *
 * FIXED: was returning hardcoded data:[] — now calls marketService.getCandles()
 * which cascades through all providers until data is found.
 */
async function getCandles(req, res, next) {
  try {
    const symbol = (req.params?.symbol || req.query?.symbol || '').toUpperCase();

    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Missing symbol parameter' });
    }

    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit) || 300, 1000);

    // ── Delegate to full cascade (crypto + forex + metals + synthetic fallback) ──
    const candles = await marketService.getCandles(symbol, interval, limit);

    // Normalize to TradingView format (time in SECONDS, all values as numbers)
    const formatted = (candles || []).map((c) => ({
      time:   Number(c.time) > 9999999999 ? Math.floor(Number(c.time) / 1000) : Number(c.time),
      open:   Number(c.open)   || 0,
      high:   Number(c.high)   || 0,
      low:    Number(c.low)    || 0,
      close:  Number(c.close)  || 0,
      volume: Number(c.volume) || 0,
    })).filter(c => c.time > 0 && c.open > 0);

    return res.json({
      success: true,
      data: formatted,
      symbol,
      interval,
      count: formatted.length,
    });
  } catch (error) {
    console.error('[market.controller] getCandles error:', error.message);
    // Always return success:true with empty array — client shows "no data" gracefully
    return res.json({
      success: true,
      data: [],
      symbol: (req.params?.symbol || req.query?.symbol || '').toUpperCase(),
      interval: req.query.interval || '1h',
      count: 0,
    });
  }
}

async function getPrice(req, res, next) {
  try {
    const symbol = (req.params?.symbol || req.query?.symbol || '').toUpperCase();
    if (!symbol) return res.status(400).json({ success: false, error: 'Missing symbol' });

    const price = await marketService.getPrice(symbol);
    return res.json({ success: true, data: price, symbol, timestamp: Date.now() });
  } catch (error) {
    console.error('[market.controller] getPrice error:', error.message);
    return res.status(503).json({ success: false, error: 'Price feed temporarily unavailable' });
  }
}

async function getMarkets(req, res, next) {
  try {
    const markets = await marketService.getMarkets();
    return res.json({ success: true, data: markets || [], count: (markets || []).length, timestamp: Date.now() });
  } catch (error) {
    console.error('[market.controller] getMarkets error:', error.message);
    return res.status(503).json({ success: false, data: [], error: 'Market data temporarily unavailable' });
  }
}

async function searchAssets(req, res, next) {
  try {
    const query = req.query.q || '';
    if (query.length < 2) return res.json({ success: true, data: [], message: 'Query too short' });
    const results = await marketService.searchAssets(query);
    return res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
}

async function getHealth(req, res, next) {
  try {
    const health = await marketService.getHealth();
    return res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMarkets, getPrice, getCandles, searchAssets, getHealth };