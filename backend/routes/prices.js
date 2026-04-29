// routes/prices.js
// ── MARKETS ROUTES (CRYPTO + FOREX + METALS) ──

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pricesController');

// ── Crypto (existing) ──
router.get('/list',              ctrl.list);

// ── Forex ──
router.get('/forex',             ctrl.forexList);

// ── Metals ──
router.get('/metals',            ctrl.metalsList);

// ── All unified ──
router.get('/all',               ctrl.allList);

// ── Single symbol + OHLC (order matters) ──
router.get('/:symbol/ohlc',      ctrl.ohlc);
router.get('/:symbol',           ctrl.one);

module.exports = router;