// services/otpService.js
// ── OTP generation / hashing / verification ──

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;    // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 3;

// Cryptographically secure 6-digit numeric code
function generateOtp() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(OTP_LENGTH, '0');
}

async function issueOtp(user, purpose) {
  // Cooldown check
  if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.otpLastSentAt.getTime())) / 1000);
    const err = new Error(`Please wait ${waitSec}s before requesting another code.`);
    err.statusCode = 429;
    throw err;
  }

  const otp = generateOtp();
  user.otpHash = await bcrypt.hash(otp, 8);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpPurpose = purpose;
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();
  return otp; // plaintext returned to caller ONLY so it can be emailed — never stored/logged
}

async function verifyOtp(user, submittedOtp, expectedPurpose) {
  if (!user.otpHash || !user.otpExpires || user.otpPurpose !== expectedPurpose) {
    const err = new Error('No active code. Please request a new one.');
    err.statusCode = 400; throw err;
  }
  if (user.otpExpires.getTime() < Date.now()) {
    const err = new Error('Code expired. Please request a new one.');
    err.statusCode = 400; throw err;
  }
  if (user.otpAttempts >= MAX_ATTEMPTS) {
    clearOtp(user);
    await user.save();
    const err = new Error('Too many incorrect attempts. Please request a new code.');
    err.statusCode = 429; throw err;
  }

  const ok = await bcrypt.compare(submittedOtp, user.otpHash);
  if (!ok) {
    user.otpAttempts += 1;
    await user.save();
    const remaining = MAX_ATTEMPTS - user.otpAttempts;
    const err = new Error(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    err.statusCode = 400; throw err;
  }

  // success — clear OTP
  clearOtp(user);
  await user.save();
  return true;
}

function clearOtp(user) {
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  user.otpAttempts = 0;
  user.otpLastSentAt = undefined;
}

module.exports = { issueOtp, verifyOtp, clearOtp, OTP_TTL_MS, MAX_ATTEMPTS };