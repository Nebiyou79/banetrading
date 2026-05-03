// models/User.js
// ── User model ──
// Preserves previously-documented fields. Module 7 update: autoMode becomes
// a String enum ('off' | 'alwaysWin' | 'alwaysLose' | 'random'). A pre-save
// migration converts legacy Boolean values transparently.
//
// BALANCE FIX: Added lockedBalances map for pending-withdrawal amounts.
// markModified('balances') and markModified('lockedBalances') called in pre-save
// so Mongoose detects nested object mutations reliably.

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

  // ── Available balances (multi-currency) ──
  // These are the SPENDABLE amounts. Pending-withdrawal amounts live in lockedBalances.
  balances: {
    USDT: { type: Number, default: 0, min: 0 },
    BTC:  { type: Number, default: 0, min: 0 },
    ETH:  { type: Number, default: 0, min: 0 },
    SOL:  { type: Number, default: 0, min: 0 },
    BNB:  { type: Number, default: 0, min: 0 },
    XRP:  { type: Number, default: 0, min: 0 },
  },

  // ── Locked balances — funds held pending withdrawal approval ──
  // At withdrawal submit:  balances[c] -= amount  AND  lockedBalances[c] += amount
  // At withdrawal approve: lockedBalances[c] -= amount  (funds leave the platform)
  // At withdrawal reject:  balances[c] += amount  AND  lockedBalances[c] -= amount
  lockedBalances: {
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

  // ── Auto mode (Module 7) ──
  autoMode:         { type: mongoose.Schema.Types.Mixed, default: 'random' },

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

// ── Pre-save hook ──
// 1. Mirror balances.USDT into legacy `balance` field.
// 2. Call markModified on nested objects so Mongoose detects mutations
//    even when properties are set directly (e.g. user.balances.USDT = x).
// 3. Normalize autoMode enum.
UserSchema.pre('save', function (next) {
  // Mirror USDT → legacy balance
  if (this.balances) {
    this.balance = this.balances.USDT || 0;
  }

  // CRITICAL: Mongoose does not auto-detect mutations on nested plain objects.
  // Without markModified, user.balances.USDT = 5; user.save() may be a no-op.
  this.markModified('balances');
  this.markModified('lockedBalances');

  // Normalize legacy Boolean autoMode into the new enum-string shape.
  if (this.autoMode === true)  this.autoMode = 'alwaysWin';
  if (this.autoMode === false) this.autoMode = 'random';

  const VALID = ['off', 'random', 'alwaysWin', 'alwaysLose'];
  if (typeof this.autoMode !== 'string' || !VALID.includes(this.autoMode)) {
    this.autoMode = 'random';
  }

  next();
});

// ── Safe JSON — strip sensitive fields ──
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