// models/ConversionConfig.js
// ── CONVERSION FEE CONFIG (single document, admin-editable) ──

const mongoose = require('mongoose');

const ConversionConfigSchema = new mongoose.Schema({
  feeBps:           { type: Number, default: 100, min: 0, max: 1000 },
  minConvertUsd:    { type: Number, default: 1 },
  enabledPairs:     { type: [String], default: [] },  // empty = all pairs allowed
  updatedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ConversionConfig', ConversionConfigSchema);