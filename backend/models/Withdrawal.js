// models/Withdrawal.js
// ── Withdrawal model ──
// Extended in Module 3 with `currency`, `networkFee`, `netAmount`, and a
// fuller `network` enum.

const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount:    { type: Number, required: true, min: 0 },
  currency:  { type: String, required: true, uppercase: true, trim: true, enum: ['USDT', 'BTC', 'ETH'] },
  network:   { type: String, required: true, enum: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'] },
  toAddress: { type: String, trim: true, required: true },
  networkFee:{ type: Number, default: 0, min: 0 },
  netAmount: { type: Number, required: true, min: 0 },
  status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, trim: true },
  reviewedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:{ type: Date },
  txHash:    { type: String, trim: true },
  note:      { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);