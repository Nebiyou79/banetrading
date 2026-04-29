// routes/admin.js
// ── Admin-only routes for Module 3 (deposit/withdrawal review) ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.use(auth, isAdmin);

router.get('/deposits',                          ctrl.listDeposits);
router.get('/withdrawals',                       ctrl.listWithdrawals);
router.post('/deposits/:id/approve',             ctrl.approveDeposit);
router.post('/deposits/:id/reject',              ctrl.rejectDeposit);
router.post('/withdrawals/:id/approve',          ctrl.approveWithdrawal);
router.post('/withdrawals/:id/reject',           ctrl.rejectWithdrawal);

module.exports = router;