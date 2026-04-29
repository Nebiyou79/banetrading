// routes/funds.js
// ── User-facing funds routes (deposit/withdraw + history) ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/fundsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, depositSchema, withdrawSchema } = require('../middleware/validate');

router.get('/balance',         auth,                                                ctrl.getBalance);
router.post('/deposit',        auth, upload.single('proof'), validate(depositSchema),  ctrl.depositFunds);
router.post('/withdraw',       auth, validate(withdrawSchema),                       ctrl.withdrawFunds);
router.get('/deposits/me',     auth,                                                ctrl.getMyDeposits);
router.get('/withdrawals/me',  auth,                                                ctrl.getMyWithdrawals);

router.use((err, _req, res, _next) => {
  if (err) {
    console.error('[funds route] error:', err.message);
    return res.status(400).json({ message: err.message || 'Request failed' });
  }
  return res.status(500).json({ message: 'Server error' });
});

module.exports = router;