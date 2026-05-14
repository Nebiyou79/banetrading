// routes/user.js
// ── User profile routes with proper file URL handling ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/profileController');
const auth = require('../middleware/auth');
const { validate, updateProfileSchema, changePasswordSchema } = require('../middleware/validate');
const { uploadAvatar } = require('../middleware/upload');

// ── Profile CRUD ──
router.get('/profile',          auth,                                       ctrl.getProfile);
router.put('/profile',          auth, validate(updateProfileSchema),        ctrl.updateProfile);

// ── Password ──
router.put('/change-password',  auth, validate(changePasswordSchema),       ctrl.changePassword);

// ── Avatar ──
router.post('/avatar',          auth, uploadAvatar.single('avatar'),        ctrl.uploadAvatar);
router.delete('/avatar',        auth,                                       ctrl.deleteAvatar);

// ── Portfolio + recent activity ──
router.get('/portfolio',            auth,                                   ctrl.getPortfolio);
router.get('/transactions/recent',  auth,                                   ctrl.getRecentTransactions);

// ── Multer error surface ──
router.use((err, _req, res, _next) => {
  if (err) {
    console.error('[user route] upload error:', err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large. Max size: 5MB' });
    }
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  return res.status(500).json({ message: 'Server error' });
});

module.exports = router;