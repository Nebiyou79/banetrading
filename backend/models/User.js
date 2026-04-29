// models/User.js
// ── User model ──
// Preserves previously-documented fields and EXTENDS with OTP, referral,
// and now with per-currency balances map.

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ── Identity ──
  name:             { type: String, required: true, trim: true },
  displayName:      { type: String, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password:         { type: String, required: true },
  country:          { type: String, trim: true },
  phone:            { type: String, trim: true },
  avatarUrl:        { type: String, trim: true },
  role:             { type: String, enum: ['user', 'admin'], default: 'user', index: true },

  // ── Balances (multi-currency) ──
  balances: {
    USDT: { type: Number, default: 0, min: 0 },
    BTC:  { type: Number, default: 0, min: 0 },
    ETH:  { type: Number, default: 0, min: 0 },
    SOL:  { type: Number, default: 0, min: 0 },
    BNB:  { type: Number, default: 0, min: 0 },
    XRP:  { type: Number, default: 0, min: 0 },
  },

  // DEPRECATED — kept for backward compatibility. Read balances.USDT directly.
  balance:          { type: Number, default: 0, min: 0 },

  // ── Email verification ──
  isEmailVerified:  { type: Boolean, default: false },
  emailVerifiedAt:  { type: Date },

  // ── Password reset ──
  passwordResetToken:   { type: String },
  passwordResetExpires: { type: Date },

  // ── Refresh token ──
  refreshTokenHash:  { type: String },
  refreshTokenIssuedAt: { type: Date },
  passwordUpdatedAt: { type: Date },

  // ── Account freeze ──
  isFrozen:         { type: Boolean, default: false },
  freezeReason:     { type: String, trim: true },

  // ── KYC ──
  kycTier:          { type: Number, default: 1, min: 1, max: 3 },
  kycStatus:        { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },

  // ── Auto mode ──
  autoMode:         { type: Boolean, default: false },

  // ── OTP ──
  otpHash:          { type: String },
  otpExpires:       { type: Date },
  otpPurpose:       { type: String, enum: ['email_verification', 'password_reset'] },
  otpAttempts:      { type: Number, default: 0 },
  otpLastSentAt:    { type: Date },

  // ── Referral / promo ──
  promoCodeUsed:    { type: String, uppercase: true, trim: true },
  ownPromoCode:     { type: String, uppercase: true, trim: true, unique: true, sparse: true },
  referralCount:    { type: Number, default: 0 },
  bonusUnlocked:    { type: Boolean, default: false },
  bonusCreditedAt:  { type: Date },
}, { timestamps: true });

// ── Pre-save: mirror balances.USDT into legacy balance ──
UserSchema.pre('save', function (next) {
  if (this.isModified('balances') && this.balances) {
    this.balance = this.balances.USDT || 0;
  }
  next();
});

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