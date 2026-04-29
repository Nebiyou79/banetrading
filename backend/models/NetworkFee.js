// models/NetworkFee.js
// ── Per-network withdrawal fee ──

const mongoose = require('mongoose');

const NetworkFeeSchema = new mongoose.Schema({
  network: {
    type: String,
    required: true,
    unique: true,
    enum: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'],
    index: true,
  },
  fee:       { type: Number, required: true, min: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('NetworkFee', NetworkFeeSchema);