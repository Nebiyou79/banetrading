// services/tradeResolver.js
// ── TRADE RESOLVER ──
// Schedules and resolves binary-option trades at expiry.
// Uses the new market.service exclusively for price lookups.

const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const User  = require('../models/User');

// ── Lazy-load aggregators ──
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

// ── In-memory timer map (tradeId → Timeout handle) ──
const timers = new Map();

// ── Schedule resolution for a freshly placed trade ──
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

// ── Resolve a single trade by id ──
async function resolve(tradeId) {
  const trade = await Trade.findOne({ _id: tradeId, status: 'pending' });
  if (!trade) return; // already resolved or cancelled

  const user = await User.findById(trade.userId);
  if (!user) {
    trade.status     = 'cancelled';
    trade.resolvedAt = new Date();
    trade.resolvedBy = 'expired';
    await trade.save();
    return;
  }

  // ── Determine outcome based on autoMode ──
  const mode = typeof user.autoMode === 'string' ? user.autoMode : 'random';
  let win;
  let resolvedBy;
  if (mode === 'alwaysWin')       { win = true;  resolvedBy = 'auto-win';    }
  else if (mode === 'alwaysLose') { win = false; resolvedBy = 'auto-lose';   }
  else {
    win        = Math.random() < 0.5;
    resolvedBy = win ? 'random-win' : 'random-lose';
  }

  // ── Snapshot exit price (informational only) ──
  const exitPrice = await fetchPriceForPair(trade.pair, trade.pairClass).catch(() => trade.entryPrice);

  const stake      = Number(trade.stake);
  const multiplier = Number(trade.planMultiplier);
  const feeBps     = Number(trade.feeBps);

  if (win) {
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
    // On loss the stake was already debited at placement — nothing to refund.
    trade.status     = 'lost';
    trade.resolvedAt = new Date();
    trade.exitPrice  = exitPrice;
    trade.payout     = 0;
    trade.feeAmount  = 0;
    trade.netResult  = -stake;
    trade.resolvedBy = resolvedBy;
    await trade.save();
  }
}

// ── Cancel a scheduled (but not yet resolved) trade ──
function cancelScheduled(tradeId) {
  const id = String(tradeId);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

// ── Resume pending trades on server boot ──
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

// ── Helper: fetch current price for a trading pair ──
async function fetchPriceForPair(pair, pairClass) {
  // Crypto
  if (pairClass === 'crypto') {
    const marketService = getMarketService();
    if (marketService) {
      try {
        const result = await marketService.getPrice(pair);
        if (result?.price && result.price > 0) return result.price;
      } catch { /* fall through */ }
    }
  }

  // Forex / Metals
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