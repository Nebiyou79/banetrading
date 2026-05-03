// services/tradeResolver.js
// ── TRADE RESOLVER ──
// FIXED P&L: fee = 2% of STAKE (not profit)
//
// WIN:
//   profit    = stake * multiplier
//   fee       = stake * 0.02
//   credit    = stake + profit - fee
//   netResult = profit - fee
//
// LOSS:
//   loss      = stake * multiplier
//   fee       = stake * 0.02
//   netResult = -(loss + fee)
//   credit    = stake - loss - fee   (remaining returned to user)

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
    resolve(id).catch((err) => console.error(`[tradeResolver] resolve(${id}) failed:`, err.message));
  }, ms);
  timers.set(id, timer);
}

// ── Public: resolve a single trade by id ──
async function resolve(tradeId) {
  // Atomic lock — only one resolver wins per trade
  const trade = await Trade.findOneAndUpdate(
    { _id: tradeId, status: 'pending' },
    { $set: { status: 'pending' } },   // no-op write to confirm lock
    { new: true },
  );
  if (!trade) return;   // already resolved or missing

  const user = await User.findById(trade.userId);
  if (!user) {
    trade.status     = 'cancelled';
    trade.resolvedAt = new Date();
    trade.resolvedBy = 'expired';
    await trade.save();
    return;
  }

  // ── Decide outcome from user.autoMode ──
  const mode = typeof user.autoMode === 'string' ? user.autoMode : 'random';
  let win;
  let resolvedBy;
  if (mode === 'alwaysWin')        { win = true;  resolvedBy = 'auto-win';    }
  else if (mode === 'alwaysLose')  { win = false; resolvedBy = 'auto-lose';   }
  else {
    win        = Math.random() < 0.5;
    resolvedBy = win ? 'random-win' : 'random-lose';
  }

  // ── Get exit price (best-effort; outcome already decided) ──
  const exitPrice = await fetchPriceForPair(trade.pair, trade.pairClass).catch(() => trade.entryPrice);

  const stake      = Number(trade.stake);
  const multiplier = Number(trade.planMultiplier);
  // ── FEE = 2% of STAKE (fixed, regardless of win/loss) ──
  const fee        = stake * (Number(trade.feeBps) / 10000);  // feeBps=200 → 0.02

  if (win) {
    // profit    = stake × multiplier
    // credit    = stake + profit - fee   (stake returned + profit, minus fee)
    // netResult = profit - fee           (signed net gain)
    const profit    = stake * multiplier;
    const credit    = stake + profit - fee;
    const netResult = profit - fee;

    // Guard against negative credit (edge case: very small stake + large fee)
    const safecredit = Math.max(0, credit);

    user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + safecredit;
    await user.save();

    trade.status     = 'won';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = safecredit;
    trade.feeAmount  = fee;
    trade.netResult  = netResult;
    trade.resolvedBy = resolvedBy;
    await trade.save();
  } else {
    // loss      = stake × multiplier
    // remaining = stake - loss - fee     (what the user gets back, if anything)
    // netResult = -(loss + fee)          (total signed loss)
    const loss      = stake * multiplier;
    const remaining = stake - loss - fee;
    const netResult = -(loss + fee);

    // If remaining > 0, refund it; stake was already debited at placement
    if (remaining > 0) {
      user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + remaining;
      await user.save();
    }

    trade.status     = 'lost';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = Math.max(0, remaining);
    trade.feeAmount  = fee;
    trade.netResult  = netResult;
    trade.resolvedBy = resolvedBy;
    await trade.save();
  }
}

// ── Public: cancel a scheduled timer ──
function cancelScheduled(tradeId) {
  const id = String(tradeId);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

// ── Public: boot recovery ──
async function resumePendingOnBoot() {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[tradeResolver] DB not ready, skipping boot recovery');
    return;
  }
  const pending = await Trade.find({ status: 'pending' }).lean();
  let overdue    = 0;
  let rescheduled = 0;
  const now = Date.now();
  for (const t of pending) {
    const ms = new Date(t.expiresAt).getTime() - now;
    if (ms <= 0) {
      overdue++;
      await resolve(String(t._id)).catch((err) =>
        console.error('[tradeResolver] boot resolve failed:', err.message)
      );
    } else {
      rescheduled++;
      scheduleResolution(t);
    }
  }
  console.log(`[tradeResolver] boot recovery: ${overdue} resolved, ${rescheduled} rescheduled`);
}

// ── Helpers ──
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