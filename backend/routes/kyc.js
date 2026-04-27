// routes/kyc.js
const router = require('express').Router();
const kyc = require('../controllers/kycController');
const auth = require('../middleware/auth');
const { uploadKYC, handleUploadError } = require('../middleware/upload');

router.post('/submit', auth, uploadKYC, handleUploadError, kyc.submitKYC);
router.get('/status',  auth, kyc.getKYCStatus);

module.exports = router;