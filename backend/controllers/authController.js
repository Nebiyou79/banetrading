// controllers/authController.js
// ── OTP-based authentication controller ──

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const otpService = require('../services/otpService');
const { sendOtpEmail } = require('../services/emailService');

// ── Config ──
const ACCESS_TTL  = process.env.JWT_ACCESS_TTL  || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';
const RESET_TTL   = process.env.JWT_RESET_TTL   || '10m';

// ── Helpers ──
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL },
  );
}

function signRefreshToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { sub: user._id.toString(), jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL },
  );
  return token;
}

function signResetToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { sub: user._id.toString(), jti, typ: 'pwd_reset' },
    process.env.JWT_RESET_SECRET,
    { expiresIn: RESET_TTL },
  );
}

async function storeRefreshHash(user, refreshToken) {
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.refreshTokenIssuedAt = new Date();
  await user.save();
}

function publicUser(user) {
  return user.toJSON();
}

// ── POST /api/auth/register ──
async function register(req, res) {
  try {
    const { name, email, password, country, promoCode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      // Unverified account with same email — re-issue OTP instead of creating duplicate.
      const otp = await otpService.issueOtp(existing, 'email_verification');
      await sendOtpEmail(existing.email, otp, 'email_verification');
      return res.status(200).json({
        message: 'Verification code sent. Please check your email.',
        email: existing.email,
      });
    }

    // ── Promo validation (optional) ──
    let promoOwnerUser = null;
    let promoDoc = null;
    if (promoCode) {
      promoDoc = await PromoCode.findOne({ code: promoCode, isActive: true });
      if (!promoDoc) {
        return res.status(400).json({ message: 'Invalid or inactive promo code' });
      }
      if (promoDoc.ownerUserId) {
        promoOwnerUser = await User.findById(promoDoc.ownerUserId);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: passwordHash,
      country,
      role: 'user',
      isEmailVerified: false,
      promoCodeUsed: promoCode || undefined,
    });

    // ── Promo bookkeeping ──
    if (promoDoc) {
      promoDoc.usageCount += 1;
      await promoDoc.save();

      if (promoOwnerUser) {
        promoOwnerUser.referralCount = (promoOwnerUser.referralCount || 0) + 1;
        if (!promoOwnerUser.bonusUnlocked && promoOwnerUser.referralCount >= (promoDoc.bonusThreshold || 25)) {
          promoOwnerUser.bonusUnlocked = true;
          // TODO: credit bonus to user balance — implement in a later phase
        }
        await promoOwnerUser.save();
      }
    }

    // ── Issue and email OTP ──
    const otp = await otpService.issueOtp(user, 'email_verification');
    await sendOtpEmail(user.email, otp, 'email_verification');

    return res.status(201).json({
      message: 'Account created. Verification code sent to your email.',
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
}

// ── POST /api/auth/verify-otp ──
async function verifyOtp(req, res) {
  try {
    const { email, otp, purpose } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No active code. Please request a new one.' });

    await otpService.verifyOtp(user, otp, purpose);

    if (purpose === 'email_verification') {
      user.isEmailVerified = true;
      user.emailVerifiedAt = new Date();
      // Email verified == KYC Level 1 reached.
      if (!user.kycTier || user.kycTier < 1) user.kycTier = 1;
      await user.save();
      return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    }

    if (purpose === 'password_reset') {
      const resetToken = signResetToken(user);
      user.passwordResetToken = await bcrypt.hash(resetToken, 10);
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      return res.status(200).json({ message: 'Code verified.', resetToken });
    }

    return res.status(400).json({ message: 'Unknown OTP purpose' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
}

// ── POST /api/auth/resend-otp ──
async function resendOtp(req, res) {
  try {
    const { email, purpose } = req.body;

    const user = await User.findOne({ email });
    // Enumeration safety: for password_reset, always say success.
    if (!user) {
      if (purpose === 'password_reset') {
        return res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
      }
      return res.status(400).json({ message: 'Account not found' });
    }

    if (purpose === 'email_verification' && user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified. Please log in.' });
    }

    const otp = await otpService.issueOtp(user, purpose);
    await sendOtpEmail(user.email, otp, purpose);

    return res.status(200).json({ message: 'A new code has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
}

// ── POST /api/auth/login ──
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED' });
    }
    if (user.isFrozen) {
      return res.status(403).json({ message: user.freezeReason || 'Your account has been frozen. Please contact support.' });
    }

    const accessToken  = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await storeRefreshHash(user, refreshToken);

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: publicUser(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/auth/refresh ──
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (_e) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!match) return res.status(401).json({ message: 'Session expired. Please log in again.' });
    if (user.isFrozen) return res.status(403).json({ message: user.freezeReason || 'Account is frozen' });

    const newAccess  = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    await storeRefreshHash(user, newRefresh);

    return res.status(200).json({
      accessToken: newAccess,
      refreshToken: newRefresh,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/auth/forgot-password ──
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Enumeration safety — always succeed
    if (!user) {
      return res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
    }

    try {
      const otp = await otpService.issueOtp(user, 'password_reset');
      await sendOtpEmail(user.email, otp, 'password_reset');
    } catch (inner) {
      // If cooldown is active, we still return success to avoid enumeration.
      if (inner.statusCode !== 429) console.error(inner);
    }

    return res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/auth/verify-reset-otp ──
async function verifyResetOtp(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'No active code. Please request a new one.' });

    await otpService.verifyOtp(user, otp, 'password_reset');

    const resetToken = signResetToken(user);
    user.passwordResetToken = await bcrypt.hash(resetToken, 10);
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return res.status(200).json({ message: 'Code verified.', resetToken });
  } catch (err) {
    console.error(err);
    return res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
}

// ── POST /api/auth/reset-password ──
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (_e) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired. Please request a new one.' });
    }
    if (payload.typ !== 'pwd_reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
      return res.status(400).json({ message: 'Reset link is invalid or has already been used.' });
    }
    if (user.passwordResetExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    const match = await bcrypt.compare(token, user.passwordResetToken);
    if (!match) return res.status(400).json({ message: 'Reset link is invalid or has already been used.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordUpdatedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all sessions
    user.refreshTokenHash = undefined;
    user.refreshTokenIssuedAt = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset. Please log in with your new password.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/auth/logout ──
async function logout(req, res) {
  try {
    if (req.user) {
      req.user.refreshTokenHash = undefined;
      req.user.refreshTokenIssuedAt = undefined;
      await req.user.save();
    }
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  logout,
};