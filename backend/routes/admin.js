// routes/admin.js
// ── Admin-only routes ──
// Covers deposit/withdrawal review, dashboard stats, user management,
// and enhanced query support for deposit/withdrawal listing.

const express = require('express');
const router = express.Router();

const adminCtrl = require('../controllers/adminController');
const adminStatsCtrl = require('../controllers/adminStatsController');
const adminUserCtrl = require('../controllers/adminUserController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, adminUpdateUserSchema } = require('../middleware/validate');

// ── All routes below require auth + admin ──
router.use(auth, isAdmin);

// ── Dashboard stats ──
router.get('/stats', adminStatsCtrl.getStats);

// ── User management ──
router.get('/users',                         adminUserCtrl.listUsers);
router.patch('/users/:userId',               validate(adminUpdateUserSchema), adminUserCtrl.updateUser);
router.delete('/users/:userId',              adminUserCtrl.deleteUser);

// ── Deposits (enhanced with search/currency query params) ──
router.get('/deposits',                      adminCtrl.listDeposits);
router.post('/deposits/:id/approve',         adminCtrl.approveDeposit);
router.post('/deposits/:id/reject',          adminCtrl.rejectDeposit);

// ── Withdrawals (enhanced with search/currency query params) ──
router.get('/withdrawals',                   adminCtrl.listWithdrawals);
router.post('/withdrawals/:id/approve',      adminCtrl.approveWithdrawal);
router.post('/withdrawals/:id/reject',       adminCtrl.rejectWithdrawal);

module.exports = router;