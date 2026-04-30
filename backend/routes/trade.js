// routes/trade.js
// ── Trading routes (Module 7) ──

const router = require('express').Router();
const trade = require('../controllers/tradeController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, tradePlaceSchema, tradingConfigSchema, tradeAutoModeSchema } = require('../middleware/validate');

// ── User routes ──
router.get('/config',                auth, trade.getConfig);
router.get('/pairs',                 auth, trade.getPairs);
router.post('/place',                auth, validate(tradePlaceSchema), trade.placeTrade);
router.get('/active',                auth, trade.getActive);
router.get('/history',               auth, trade.getHistory);

// ── Admin routes (must come before /:id) ──
router.get('/admin/all',             auth, isAdmin, trade.adminListAll);
router.put('/admin/config',          auth, isAdmin, validate(tradingConfigSchema), trade.adminUpdateConfig);
router.get('/admin/automode/:userId',auth, isAdmin, trade.adminGetAutoMode);
router.put('/admin/automode/:userId',auth, isAdmin, validate(tradeAutoModeSchema), trade.adminSetAutoMode);

// ── Single trade (last — generic id matcher) ──
router.get('/:id',                   auth, trade.getOne);

module.exports = router;