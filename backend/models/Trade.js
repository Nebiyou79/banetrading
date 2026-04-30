// models/Trade.js
// ── Trade model (Module 7) ──
// Full trade record with plan metadata, entry/exit prices, payout calculation.

const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ── Pair info ──
  pair:            { type: String, required: true },        // 'BTCUSDT'
  pairClass:       { type: String, enum: ['crypto', 'forex', 'metals'], required: true },
  pairDisplay:     { type: String, required: true },        // 'BTC/USDT'

  // ── Direction ──
  direction:       { type: String, enum: ['buy', 'sell'], required: true },

  // ── Stake (asset-denominated) ──
  tradingAsset:    { type: String, enum: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'], required: true },
  stake:           { type: Number, required: true, min: 0 },

  // ── Plan ──
  planKey:         { type: String, enum: ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'], required: true },
  planMultiplier:  { type: Number, required: true },
  planDurationSec: { type: Number, required: true },
  feeBps:          { type: Number, required: true },        // 200 = 2%

  // ── Pricing ──
  entryPrice:      { type: Number, required: true },
  expiresAt:       { type: Date, required: true, index: true },
  resolveAt:       { type: Date, required: true },

  // ── Resolution ──
  status:          { type: String, enum: ['pending', 'won', 'lost', 'cancelled'], default: 'pending', index: true },
  resolvedAt:      { type: Date },
  exitPrice:       { type: Number },
  payout:          { type: Number },          // gross credit returned to user (won only)
  netResult:       { type: Number },          // signed: positive on win, negative on loss
  feeAmount:       { type: Number },          // fee taken from profit (won only)
  resolvedBy:      { type: String, enum: ['auto-win', 'auto-lose', 'random-win', 'random-lose', 'admin', 'expired'] },
}, { timestamps: true });

TradeSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Trade', TradeSchema);