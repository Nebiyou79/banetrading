// routes/history.js
// ── History routes ──

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/historyController');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getHistory);

module.exports = router;