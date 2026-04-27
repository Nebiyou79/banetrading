// routes/funds.js
const router = require('express').Router();
const funds = require('../controllers/fundsController');
const auth = require('../middleware/auth');
const { uploadSingle, handleUploadError } = require('../middleware/upload');
const { validate, withdrawSchema } = require('../middleware/validate');

router.get('/balance',   auth, funds.getBalance);
router.post('/deposit',  auth, uploadSingle, handleUploadError, funds.depositFunds);
router.post('/withdraw', auth, validate(withdrawSchema), funds.withdrawFunds);

module.exports = router;