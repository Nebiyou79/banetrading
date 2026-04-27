// models/User.js
// ── User model ──
// Preserves previously-documented fields (email verification, password reset,
// refresh-token hashing, freeze, KYC tier/status, autoMode) and EXTENDS with
// OTP fields, referral fields, and bonus fields per DOCUMENT_1 Section B.2.

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ── Identity ──
  name:             { type: String, required: true, trim: true },
  displayName:      { type: String, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password:         { type: String, required: true }, // bcrypt hash
  country:          { type: String, trim: true },
  phone:            { type: String, trim: true },
  avatarUrl:        { type: String, trim: true },
  role:             { type: String, enum: ['user', 'admin'], default: 'user', index: true },

  // ── Balance (single-currency placeholder until multi-currency tracking is live) ──
  balance:          { type: Number, default: 0, min: 0 },

  // ── Email verification ──
  isEmailVerified:  { type: Boolean, default: false },
  emailVerifiedAt:  { type: Date },

  // ── Password reset (short-lived token issued AFTER successful OTP verification) ──
  passwordResetToken:   { type: String },
  passwordResetExpires: { type: Date },

  // ── Refresh token (bcrypt-hashed, single-session style) ──
  refreshTokenHash:  { type: String },
  refreshTokenIssuedAt: { type: Date },

  // ── Account freeze (admin-controlled) ──
  isFrozen:         { type: Boolean, default: false },
  freezeReason:     { type: String, trim: true },

  // ── KYC ──
  kycTier:          { type: Number, default: 0 },
  kycStatus:        { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },

  // ── Admin-controlled auto mode ──
  autoMode:         { type: Boolean, default: false },

  // ── OTP (registration + password reset share this) ──
  otpHash:          { type: String },       // bcrypt hash of the 6-digit code
  otpExpires:       { type: Date },
  otpPurpose:       { type: String, enum: ['email_verification', 'password_reset'] },
  otpAttempts:      { type: Number, default: 0 },
  otpLastSentAt:    { type: Date },         // for 60s cooldown

  // ── Referral / promo ──
  promoCodeUsed:    { type: String, uppercase: true, trim: true },    // the code THIS user signed up with
  ownPromoCode:     { type: String, uppercase: true, trim: true, unique: true, sparse: true }, // the code THIS user owns
  referralCount:    { type: Number, default: 0 },
  bonusUnlocked:    { type: Boolean, default: false },
  bonusCreditedAt:  { type: Date },       // null until bonus-crediting logic runs (future TODO)
}, { timestamps: true });

// ── Safe JSON ──
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokenHash;
  delete obj.refreshTokenIssuedAt;
  delete obj.otpHash;
  delete obj.otpExpires;
  delete obj.otpPurpose;
  delete obj.otpAttempts;
  delete obj.otpLastSentAt;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);