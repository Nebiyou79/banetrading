// routes/trade.js
const router = require('express').Router();
const trade = require('../controllers/tradeController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const requireKyc = require('../middleware/requireKyc');
const { validate, tradeSchema } = require('../middleware/validate');

// User routes
router.post('/place',          auth, requireKyc, validate(tradeSchema), trade.placeTrade);
router.get('/history',         auth, trade.getUserTradeHistory);

// Admin routes
router.put('/end/:tradeId',    auth, isAdmin, trade.endTrade);
router.put('/automode/:userId',auth, isAdmin, trade.setAutoMode);
router.get('/automode/:userId',auth, isAdmin, trade.getAutoMode);

module.exports = router;