// models/DepositAddresses.js
// ── Deposit address book (single-document, map-based) ──

const mongoose = require('mongoose');

const DepositAddressSchema = new mongoose.Schema({
  // ── Per-network deposit addresses ──
  addresses: {
    'USDT-ERC20': { type: String, trim: true },
    'USDT-TRC20': { type: String, trim: true },
    'USDT-BEP20': { type: String, trim: true },
    BTC:          { type: String, trim: true },
    ETH:          { type: String, trim: true },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('DepositAddresses', DepositAddressSchema);