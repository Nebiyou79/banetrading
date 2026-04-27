// routes/prices.js
const router = require('express').Router();
const prices = require('../controllers/pricesController');

// Public — no auth required
router.get('/',           prices.getCryptoPrices);
router.get('/:id/history', prices.getHistoricalPrices);

module.exports = router;