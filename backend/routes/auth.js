// routes/auth.js
// ── Auth routes ──

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/authController');
const auth = require('../middleware/auth');
const {
  validate,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordWithTokenSchema,
  refreshSchema,
} = require('../middleware/validate');
const {
  loginLimiter,
  registerLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
  forgotPasswordLimiter,
} = require('../middleware/rareLimiter');

router.post('/register',          registerLimiter,        validate(registerSchema),                 ctrl.register);
router.post('/verify-otp',        otpVerifyLimiter,       validate(verifyOtpSchema),                ctrl.verifyOtp);
router.post('/resend-otp',        otpResendLimiter,       validate(resendOtpSchema),                ctrl.resendOtp);
router.post('/login',             loginLimiter,           validate(loginSchema),                    ctrl.login);
router.post('/refresh',                                    validate(refreshSchema),                  ctrl.refresh);
router.post('/forgot-password',   forgotPasswordLimiter,  validate(forgotPasswordSchema),           ctrl.forgotPassword);
router.post('/verify-reset-otp',  otpVerifyLimiter,       validate(verifyResetOtpSchema),           ctrl.verifyResetOtp);
router.post('/reset-password',                             validate(resetPasswordWithTokenSchema),   ctrl.resetPassword);
router.post('/logout',            auth,                   ctrl.logout);

module.exports = router;