// models/Deposit.js
// ── Deposit model ──
// Extended in Module 3 with `network` (required) and `note` (optional).
//
// BALANCE FIX: Network enum unified to match frontend DepositNetwork values
// ('USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH') so no mapping
// transform is needed between frontend submission and backend storage.

const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount:       { type: Number, required: true, min: 0 },
  currency:     { type: String, required: true, uppercase: true, trim: true, enum: ['USDT', 'BTC', 'ETH'] },

  // Network values now match frontend DepositNetwork type exactly.
  // Old values: ['ERC20','TRC20','BEP20','Bitcoin','Ethereum']
  // New values: ['USDT-ERC20','USDT-TRC20','USDT-BEP20','BTC','ETH']
  network: {
    type: String,
    required: true,
    enum: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'],
  },

  proofFilePath:{ type: String, trim: true },
  note:         { type: String, trim: true, maxlength: 500 },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  rejectionReason: { type: String, trim: true },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:   { type: Date },
  txHash:       { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Deposit', DepositSchema);