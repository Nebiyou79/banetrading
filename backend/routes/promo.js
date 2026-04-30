// routes/promo.js
// ── Promo code routes (extended with Module 8) ──

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/promoController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// ── Public ──
router.get('/validate/:code', ctrl.validateCode);

// ── User ──
router.get('/me',              auth, ctrl.getMine);
router.post('/generate',       auth, ctrl.generateMine);

// ── Module 8: Leaderboard + Referrals ──
router.get('/leaderboard',     auth, ctrl.getLeaderboard);
router.get('/my-referrals',    auth, ctrl.getMyReferrals);

// ── Admin ──
router.get('/admin/all',       auth, isAdmin, ctrl.adminListAll);
router.patch('/admin/:code',   auth, isAdmin, ctrl.adminUpdate);
router.get('/admin/grants',    auth, isAdmin, ctrl.adminGetGrants);

module.exports = router;