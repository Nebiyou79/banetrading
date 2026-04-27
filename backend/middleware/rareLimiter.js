// middleware/rareLimiter.js
// ── Rate limiters ──

const rateLimit = require('express-rate-limit');

// ── General API limiter (100 / min) ──
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

// ── Login: 10 attempts / 15 min per IP ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

// ── Registration: 5 / hour per IP ──
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registrations from this IP. Please try again later.' },
});

// ── OTP verify: 5 attempts / 10 min per IP ──
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please wait and try again.' },
});

// ── OTP resend: 3 / 10 min per IP ──
const otpResendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many resend requests. Please wait before trying again.' },
});

// ── Forgot-password: 5 / 15 min per IP ──
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again later.' },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
  forgotPasswordLimiter,
};