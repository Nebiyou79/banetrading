// routes/promo.js
// ── Promo code routes ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/promoController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Public
router.get('/validate/:code',   ctrl.validateCode);

// User
router.get('/me',               auth,           ctrl.getMine);
router.post('/generate',        auth,           ctrl.generateMine);

// Admin
router.get('/admin/all',        auth, isAdmin,  ctrl.adminListAll);
router.patch('/admin/:code',    auth, isAdmin,  ctrl.adminUpdate);

module.exports = router;