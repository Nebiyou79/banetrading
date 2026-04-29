// models/Conversion.js
// ── CONVERSION HISTORY RECORD ──

const mongoose = require('mongoose');

const ConversionSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromCurrency:  { type: String, required: true, enum: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'] },
  toCurrency:    { type: String, required: true, enum: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'] },
  fromAmount:    { type: Number, required: true, min: 0 },
  toAmount:      { type: Number, required: true, min: 0 },
  rate:          { type: Number, required: true },
  marketRate:    { type: Number, required: true },
  feeBps:        { type: Number, required: true },
  status:        { type: String, enum: ['completed', 'failed'], default: 'completed' },
}, { timestamps: true });

module.exports = mongoose.model('Conversion', ConversionSchema);