// services/tradeResolver.js
// ── TRADE RESOLVER ──
// Schedules and resolves binary-option trades at expiry.
//
// BUG 3 FIX: Loss calculation corrected.
//   BEFORE (wrong): On loss, user lost the entire stake.
//   AFTER  (fixed): On loss, user only loses the RISKED portion (stake * multiplier).
//                   The un-risked remainder (stake * (1 - multiplier)) is returned.
//
// Example — PLATINUM plan (+25%), 54800 USDT stake:
//   Risk amount  = 54800 * 0.25 = 13700 USDT
//   Fee on risk  = 13700 * 0.02 = 274 USDT  (fee only on risked portion)
//   Net loss     = -(13700 + 274) = -13974 USDT
//   Returned     = 54800 - 13700 = 41100 USDT credited back
//
// WIN example (unchanged):
//   Profit       = stake * multiplier = 13700
//   Fee on profit= 13700 * 0.02 = 274
//   Credit       = stake + profit - fee = 54800 + 13700 - 274 = 68226 USDT

const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const User  = require('../models/User');

let _marketService   = null;
let _forexAggregator = null;

function getMarketService() {
  if (!_marketService) {
    try { _marketService = require('./market/market.service'); } catch { _marketService = null; }
  }
  return _marketService;
}

function getForexAggregator() {
  if (!_forexAggregator) {
    try { _forexAggregator = require('./forexAggregator'); } catch { _forexAggregator = null; }
  }
  return _forexAggregator;
}

const timers = new Map();

function scheduleResolution(trade) {
  const id = String(trade._id);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
  const ms = Math.max(0, new Date(trade.expiresAt).getTime() - Date.now());
  const handle = setTimeout(() => {
    timers.delete(id);
    resolve(id).catch((err) =>
      console.error(`[tradeResolver] resolve(${id}) failed:`, err.message)
    );
  }, ms);
  timers.set(id, handle);
}

async function resolve(tradeId) {
  const trade = await Trade.findOne({ _id: tradeId, status: 'pending' });
  if (!trade) return;

  const user = await User.findById(trade.userId);
  if (!user) {
    trade.status     = 'cancelled';
    trade.resolvedAt = new Date();
    trade.resolvedBy = 'expired';
    await trade.save();
    return;
  }

  const mode = typeof user.autoMode === 'string' ? user.autoMode : 'random';
  let win;
  let resolvedBy;
  if (mode === 'alwaysWin')       { win = true;  resolvedBy = 'auto-win';    }
  else if (mode === 'alwaysLose') { win = false; resolvedBy = 'auto-lose';   }
  else {
    win        = Math.random() < 0.5;
    resolvedBy = win ? 'random-win' : 'random-lose';
  }

  const exitPrice = await fetchPriceForPair(trade.pair, trade.pairClass).catch(() => trade.entryPrice);

  const stake      = Number(trade.stake);
  const multiplier = Number(trade.planMultiplier);
  const feeBps     = Number(trade.feeBps);

  if (win) {
    // WIN: return stake + profit minus fee on profit
    const profit    = stake * multiplier;
    const fee       = profit * (feeBps / 10000);
    const credit    = stake + profit - fee;
    const netResult = profit - fee;

    user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + Math.max(0, credit);
    user.markModified('balances');
    await user.save();

    trade.status     = 'won';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = Math.max(0, credit);
    trade.feeAmount  = fee;
    trade.netResult  = netResult;
    trade.resolvedBy = resolvedBy;
    await trade.save();

  } else {
    // BUG 3 FIX: LOSS — only lose the risked portion (stake * multiplier)
    // The un-risked remainder is returned to the user.
    const riskAmount  = stake * multiplier;          // e.g. 54800 * 0.25 = 13700
    const fee         = riskAmount * (feeBps / 10000); // fee on risked portion only
    const totalLoss   = riskAmount + fee;             // e.g. 13700 + 274 = 13974
    const returnAmt   = stake - riskAmount;           // e.g. 54800 - 13700 = 41100
    const netResult   = -(totalLoss);                 // signed negative

    // Credit back the un-risked portion
    if (returnAmt > 0) {
      user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + returnAmt;
      user.markModified('balances');
      await user.save();
    }

    trade.status     = 'lost';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = returnAmt;   // amount returned (un-risked portion)
    trade.feeAmount  = fee;
    trade.netResult  = netResult;   // negative: total loss including fee
    trade.resolvedBy = resolvedBy;
    await trade.save();
  }
}

function cancelScheduled(tradeId) {
  const id = String(tradeId);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

async function resumePendingOnBoot() {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[tradeResolver] DB not ready — skipping boot recovery');
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

  console.log(`[tradeResolver] boot recovery: ${overdue} resolved immediately, ${rescheduled} rescheduled`);
}

async function fetchPriceForPair(pair, pairClass) {
  if (pairClass === 'crypto') {
    const marketService = getMarketService();
    if (marketService) {
      try {
        const result = await marketService.getPrice(pair);
        if (result?.price && result.price > 0) return result.price;
      } catch { /* fall through */ }
    }
  }

  if (pairClass === 'forex' || pairClass === 'metals') {
    const forexAgg = getForexAggregator();
    if (forexAgg) {
      try {
        const { rows } = await forexAgg.getForexAndMetals();
        const row = rows.find((r) => r.symbol === pair);
        if (row?.price && row.price > 0) return row.price;
      } catch { /* fall through */ }
    }
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