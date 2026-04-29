// models/Deposit.js
// ── Deposit model ──
// Extended in Module 3 with `network` (required) and `note` (optional).

const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount:       { type: Number, required: true, min: 0 },
  currency:     { type: String, required: true, uppercase: true, trim: true, enum: ['USDT', 'BTC', 'ETH'] },
  network:      { type: String, required: true, enum: ['ERC20', 'TRC20', 'BEP20', 'Bitcoin', 'Ethereum'] },
  proofFilePath:{ type: String, trim: true },
  note:         { type: String, trim: true, maxlength: 500 },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, trim: true },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:   { type: Date },
  txHash:       { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Deposit', DepositSchema);