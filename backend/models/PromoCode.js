// models/PromoCode.js
// ── PromoCode model (extended with bonus milestone fields) ──

const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  // ── Existing fields ──
  code:                 { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 6, maxlength: 12 },
  ownerUserId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  usageCount:           { type: Number, default: 0 },
  isActive:             { type: Boolean, default: true },
  bonusThreshold:       { type: Number, default: 25 },
  createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Module 8: Signup milestone ──
  signupThreshold:      { type: Number, default: 25 },
  signupBonusUsd:       { type: Number, default: 50 },
  signupBonusGranted:   { type: Boolean, default: false },
  signupBonusGrantedAt: { type: Date },

  // ── Module 8: Deposit milestone ──
  depositThreshold:     { type: Number, default: 25 },
  depositBonusUsd:      { type: Number, default: 150 },
  depositBonusGranted:  { type: Boolean, default: false },
  depositBonusGrantedAt:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);