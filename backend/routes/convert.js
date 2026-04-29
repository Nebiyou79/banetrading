// routes/convert.js
// ── CONVERSION ROUTES ──

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/conversionController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, convertQuoteSchema, convertExecuteSchema, convertConfigSchema } = require('../middleware/validate');

// ── User endpoints ──
router.get('/balances',    auth,                                          ctrl.getBalances);
router.post('/quote',      auth, validate(convertQuoteSchema),            ctrl.quote);
router.post('/execute',    auth, validate(convertExecuteSchema),          ctrl.execute);
router.get('/history',     auth,                                          ctrl.history);

// ── Admin endpoints ──
router.get('/admin/config',  auth, isAdmin,                               ctrl.getConfig);
router.put('/admin/config',  auth, isAdmin, validate(convertConfigSchema), ctrl.updateConfig);

module.exports = router;