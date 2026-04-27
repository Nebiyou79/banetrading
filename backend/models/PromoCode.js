// models/PromoCode.js
// ── PromoCode model ──

const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 6, maxlength: 12 },
  ownerUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system-generated
  usageCount:     { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  bonusThreshold: { type: Number, default: 25 },   // signups needed to unlock bonus
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', PromoCodeSchema);