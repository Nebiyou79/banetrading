// routes/kyc.js
// ── KYC routes ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/kycController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const { uploadKYC, uploadAddressDoc } = require('../middleware/upload');
const { validate, kycLevel2Schema, kycLevel3Schema, kycRejectSchema } = require('../middleware/validate');

// ── User-facing ──
router.get('/status',                      auth,                                                       ctrl.getStatus);
router.post('/level2',                     auth, uploadKYC,        validate(kycLevel2Schema),          ctrl.submitLevel2);
router.post('/level3',                     auth, uploadAddressDoc, validate(kycLevel3Schema),          ctrl.submitLevel3);

// ── Admin ──
router.use('/admin', auth, isAdmin);
router.get('/admin/pending',                                                                            ctrl.listPending);
router.patch('/admin/:userId/level/:level/approve',                                                     ctrl.adminApprove);
router.patch('/admin/:userId/level/:level/reject',  validate(kycRejectSchema),                          ctrl.adminReject);

// ── Multer error surface ──
router.use((err, _req, res, _next) => {
  if (err) {
    console.error('[kyc route] error:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File is too large (max 5 MB).' });
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  return res.status(500).json({ message: 'Server error' });
});

module.exports = router;