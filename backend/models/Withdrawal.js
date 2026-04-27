// models/Withdrawal.js
// ── Withdrawal model ──
// Placeholder shape sufficient for aggregation. Full withdrawal flow lives
// in Document 3.

const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount:     { type: Number, required: true, min: 0 },
  currency:   { type: String, required: true, uppercase: true, trim: true, default: 'USDT' },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  toAddress:  { type: String, trim: true },
  note:       { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);