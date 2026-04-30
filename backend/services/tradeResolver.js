// services/tradeResolver.js
// ── TRADE RESOLVER ──
// Schedules in-memory setTimeout per trade, resolves via user's autoMode,
// credits/debits balances, and recovers pending trades on boot.

const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const User = require('../models/User');
const { getMarketList } = require('./priceAggregator');
const { getForexAndMetals } = require('./forexAggregator');
const { BY_BINANCE } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

// ── Active timers keyed by trade id ──
const timers = new Map();

// ── Public: schedule resolution for a freshly placed trade ──
function scheduleResolution(trade) {
  const id = String(trade._id);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
  const ms = Math.max(0, new Date(trade.expiresAt).getTime() - Date.now());
  const timer = setTimeout(() => {
    timers.delete(id);
    // fire and forget — caller should not await
    resolve(id).catch((err) => console.error(`[tradeResolver] resolve(${id}) failed:`, err.message));
  }, ms);
  timers.set(id, timer);
}

// ── Public: resolve a single trade by id ──
async function resolve(tradeId) {
  // Use atomic findOneAndUpdate to lock the trade — only one resolver wins.
  const trade = await Trade.findOneAndUpdate(
    { _id: tradeId, status: 'pending' },
    { $set: { status: 'pending' } },               // no-op write to confirm lock
    { new: true },
  );
  if (!trade) return;                                // already resolved or missing

  const user = await User.findById(trade.userId);
  if (!user) {
    trade.status = 'cancelled';
    trade.resolvedAt = new Date();
    trade.resolvedBy = 'expired';
    await trade.save();
    return;
  }

  // ── Decide outcome from user.autoMode ──
  const mode = typeof user.autoMode === 'string' ? user.autoMode : 'random';
  let win;
  let resolvedBy;
  if (mode === 'alwaysWin')        { win = true;  resolvedBy = 'auto-win'; }
  else if (mode === 'alwaysLose')  { win = false; resolvedBy = 'auto-lose'; }
  else {
    win = Math.random() < 0.5;
    resolvedBy = win ? 'random-win' : 'random-lose';
  }

  // ── Get exit price (best-effort; outcome already decided) ──
  const exitPrice = await fetchPriceForPair(trade.pair, trade.pairClass).catch(() => trade.entryPrice);

  if (win) {
    // payout formula:
    //   grossWin = stake * (1 + multiplier)
    //   profit   = grossWin - stake = stake * multiplier
    //   fee      = profit * (feeBps / 10000)
    //   credit   = grossWin - fee
    const stake     = Number(trade.stake);
    const multiplier= Number(trade.planMultiplier);
    const grossWin  = stake * (1 + multiplier);
    const profit    = grossWin - stake;
    const feeAmount = profit * (Number(trade.feeBps) / 10000);
    const credit    = grossWin - feeAmount;
    const netResult = credit - stake;            // signed positive

    // Credit user's tradingAsset balance.
    user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + credit;
    await user.save();

    trade.status     = 'won';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = credit;
    trade.feeAmount  = feeAmount;
    trade.netResult  = netResult;
    trade.resolvedBy = resolvedBy;
    await trade.save();
  } else {
    // Stake was already debited at placement — nothing to refund.
    trade.status     = 'lost';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = 0;
    trade.feeAmount  = 0;
    trade.netResult  = -Number(trade.stake);
    trade.resolvedBy = resolvedBy;
    await trade.save();
  }
}

// ── Public: cancel a scheduled timer (used if trade is admin-cancelled) ──
function cancelScheduled(tradeId) {
  const id = String(tradeId);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

// ── Public: boot recovery ──
// Find all pending trades; resolve overdue immediately, reschedule future ones.
async function resumePendingOnBoot() {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[tradeResolver] DB not ready, skipping boot recovery');
    return;
  }
  const pending = await Trade.find({ status: 'pending' }).lean();
  let overdue = 0;
  let rescheduled = 0;
  const now = Date.now();
  for (const t of pending) {
    const ms = new Date(t.expiresAt).getTime() - now;
    if (ms <= 0) {
      overdue++;
      // Resolve sequentially-ish; small await keeps us off the event-loop hot path.
      await resolve(String(t._id)).catch((err) => console.error('[tradeResolver] boot resolve failed:', err.message));
    } else {
      rescheduled++;
      scheduleResolution(t);
    }
  }
  console.log(`[tradeResolver] boot recovery: ${overdue} resolved, ${rescheduled} rescheduled`);
}

// ── Helpers ──

// Pull the live price of a single pair from whichever aggregator owns it.
async function fetchPriceForPair(pair, pairClass) {
  if (pairClass === 'crypto') {
    const meta = BY_BINANCE[pair];
    if (!meta) return null;
    const { rows } = await getMarketList();
    const row = rows.find((r) => r.symbol === meta.symbol);
    return row?.price ?? null;
  }
  if (pairClass === 'forex' || pairClass === 'metals') {
    const meta = FX_BY_SYMBOL[pair] || METAL_BY_SYMBOL[pair];
    if (!meta) return null;
    const { rows } = await getForexAndMetals();
    const row = rows.find((r) => r.symbol === pair);
    return row?.price ?? null;
  }
  return null;
}

module.exports = {
  scheduleResolution,
  resolve,
  cancelScheduled,
  resumePendingOnBoot,
  fetchPriceForPair,
};