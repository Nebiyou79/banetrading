// src/routes/market.routes.js
// ── MARKET API ROUTES ──

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/market.controller');

// GET /api/market/markets — Full market list
router.get('/markets', ctrl.getMarkets);

// GET /api/market/price/:symbol — Single price
router.get('/price/:symbol', ctrl.getPrice);

// GET /api/market/chart/:symbol — OHLC candles (TradingView compatible)
router.get('/chart/:symbol', ctrl.getCandles);

// GET /api/market/search?q=btc — Search assets
router.get('/search', ctrl.searchAssets);

// GET /api/market/health — Provider health
router.get('/health', ctrl.getHealth);

module.exports = router;