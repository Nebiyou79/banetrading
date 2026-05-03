// src/controllers/market.controller.js
// ── EXPRESS ROUTE HANDLERS FOR MARKET DATA API ──
// FIXED: getCandles now returns real OHLC data via marketService

const marketService = require('../services/market/market.service');

async function getCandles(req, res, next) {
  try {
    const symbol = req.params?.symbol || req.query?.symbol;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol parameter',
      });
    }

    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit) || 300, 1000);

    // ── FIXED: Delegate to marketService which handles crypto, forex, metals ──
    const candles = await marketService.getCandles(symbol.toUpperCase(), interval, limit);

    if (!candles || candles.length === 0) {
      // Return empty array with success — client handles empty state gracefully
      return res.json({
        success: true,
        data: [],
        symbol: symbol.toUpperCase(),
        interval,
        count: 0,
      });
    }

    // Ensure candles are in TradingView format (time in seconds)
    const formatted = candles.map((c) => ({
      time:   typeof c.time === 'number' ? c.time : Math.floor(c.time / 1000),
      open:   Number(c.open)   || 0,
      high:   Number(c.high)   || 0,
      low:    Number(c.low)    || 0,
      close:  Number(c.close)  || 0,
      volume: Number(c.volume) || 0,
    }));

    return res.json({
      success: true,
      data: formatted,
      symbol: symbol.toUpperCase(),
      interval,
      count: formatted.length,
    });
  } catch (error) {
    console.error('[market.controller] getCandles error:', error.message);
    // Return empty with success so client doesn't retry-loop on known failures
    return res.json({
      success: true,
      data: [],
      symbol: req.params?.symbol || req.query?.symbol || '',
      interval: req.query.interval || '1h',
      count: 0,
      error: error.message,
    });
  }
}

async function getPrice(req, res, next) {
  try {
    const symbol = req.params?.symbol || req.query?.symbol;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol parameter',
      });
    }

    const price = await marketService.getPrice(symbol.toUpperCase());

    return res.json({
      success: true,
      data: price,
      symbol: symbol.toUpperCase(),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[market.controller] getPrice error:', error.message);
    return res.status(503).json({
      success: false,
      error: 'Price feed temporarily unavailable',
    });
  }
}

async function getMarkets(req, res, next) {
  try {
    const markets = await marketService.getMarkets();

    return res.json({
      success: true,
      data: markets || [],
      count: markets ? markets.length : 0,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[market.controller] getMarkets error:', error.message);
    return res.status(503).json({
      success: false,
      data: [],
      error: 'Market data temporarily unavailable',
    });
  }
}

async function searchAssets(req, res, next) {
  try {
    const query = req.query.q || '';
    if (query.length < 2) {
      return res.json({ success: true, data: [], message: 'Query too short' });
    }
    const results = await marketService.searchAssets(query);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
}

async function getHealth(req, res, next) {
  try {
    const health = await marketService.getHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMarkets,
  getPrice,
  getCandles,
  searchAssets,
  getHealth,
};