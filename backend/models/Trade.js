// models/Trade.js
// ── Trade model ──
// Minimal shape sufficient for aggregation. Full trading module is separate.

const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pair:       { type: String, required: true, uppercase: true, trim: true },   // e.g. BTCUSDT
  side:       { type: String, enum: ['buy', 'sell'], required: true },
  amount:     { type: Number, required: true, min: 0 },       // base amount
  price:      { type: Number, required: true, min: 0 },       // quote price at settlement
  currency:   { type: String, required: true, uppercase: true, trim: true, default: 'USDT' }, // quote ccy
  status:     { type: String, enum: ['pending', 'won', 'lost', 'cancelled'], default: 'pending', index: true },
  pnl:        { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Trade', TradeSchema);