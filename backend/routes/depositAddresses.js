// routes/depositAddresses.js
// ── Deposit address book routes ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/depositAddressController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { validate, updateAddressesSchema } = require('../middleware/validate');

router.get('/',                 auth,                                              ctrl.getDepositAddresses);
router.put('/',                 auth, isAdmin, validate(updateAddressesSchema),    ctrl.updateDepositAddresses);

module.exports = router;