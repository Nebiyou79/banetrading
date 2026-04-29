// routes/fees.js
// ── Network fee routes ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/networkFeeController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, updateFeeSchema } = require('../middleware/validate');

router.get('/',              auth,                                          ctrl.getAllFees);
router.put('/:network',      auth, isAdmin, validate(updateFeeSchema),      ctrl.updateFee);

module.exports = router;