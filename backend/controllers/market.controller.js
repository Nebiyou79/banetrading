// src/controllers/market.controller.js
// ── EXPRESS ROUTE HANDLERS FOR MARKET DATA API ──

const marketService = require('../services/market/market.service');
const { normalizeSymbol } = require('../services/market/symbols/symbol.map');

async function getCandles(req, res, next) {
  try {
    // ⚠️ The symbol can come from req.params (when using /:symbol) 
    // OR req.query (when using ?symbol=)
    const symbol = req.params?.symbol || req.query?.symbol;

    // Guard against missing symbol
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol parameter',
      });
    }

    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit) || 300, 1000);

    res.json({
      success: true,
      data: [],
      symbol: symbol,
      interval,
    });
  } catch (error) {
    next(error);
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

    res.json({
      success: true,
      data: {
        symbol: symbol,
        price: 0,
        timestamp: Date.now(),
        provider: 'fallback',
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMarkets(req, res, next) {
  try {
    res.json({
      success: true,
      data: [],
      count: 0,
      timestamp: Date.now(),
    });
  } catch (error) {
    next(error);
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