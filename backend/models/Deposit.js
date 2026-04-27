// models/Deposit.js
// ── Deposit model ──
// Placeholder shape sufficient for aggregation in the portfolio + recent
// transactions endpoints. Full deposit flow lives in Document 3.

const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount:    { type: Number, required: true, min: 0 },
  currency:  { type: String, required: true, uppercase: true, trim: true, default: 'USDT' },
  status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  txHash:    { type: String, trim: true },
  note:      { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Deposit', DepositSchema);