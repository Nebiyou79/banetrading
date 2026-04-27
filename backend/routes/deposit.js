// routes/deposit.js
const router = require('express').Router();
const depositAddr = require('../controllers/depositAddressController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/addresses',  auth, depositAddr.getDepositAddresses);
router.put('/addresses',  auth, isAdmin, depositAddr.updateDepositAddresses);

module.exports = router;