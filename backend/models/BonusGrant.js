// models/BonusGrant.js
// ── Audit trail for every bonus credit ──

const mongoose = require('mongoose');

const BonusGrantSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  promoCode:  { type: String, required: true, uppercase: true, trim: true },
  type:       { type: String, enum: ['signup_milestone', 'deposit_milestone'], required: true },
  amountUsd:  { type: Number, required: true },
  currency:   { type: String, default: 'USDT' },
  thresholdAt:{ type: Number, required: true },
  reachedAt:  { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('BonusGrant', BonusGrantSchema);