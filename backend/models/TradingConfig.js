// models/TradingConfig.js
// ── TRADING CONFIG (single document, admin-editable) ──
// Holds the 5 plans (SILVER/GOLD/PLATINUM/DIAMOND/ELITE), the global fee in bps,
// and the list of enabled pairs (empty array = all pairs allowed).

const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  key:         { type: String, enum: ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'], required: true },
  multiplier:  { type: Number, required: true, min: 0 },     // 0.12 = +12%
  durationSec: { type: Number, required: true, min: 1 },     // 30, 60, 90, 120, 150
  minUsd:      { type: Number, required: true, min: 0 },     // 50, 10000, 40000, 90000, 130000
  active:      { type: Boolean, default: true },
}, { _id: false });

const TradingConfigSchema = new mongoose.Schema({
  plans:        { type: [PlanSchema], default: [] },
  feeBps:       { type: Number, default: 200, min: 0, max: 5000 },  // 200 = 2% of profit only
  enabledPairs: { type: [String], default: [] },                    // empty = all
  updatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('TradingConfig', TradingConfigSchema);