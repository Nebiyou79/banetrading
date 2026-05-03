// services/tradeResolver.js
// ── TRADE RESOLVER ──
// Updated to use new market aggregator system

const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const User = require('../models/User');
const { FOREX_PAIRS } = require('../config/forex');
const { METAL_PAIRS } = require('../config/metals');
const { BY_BINANCE } = require('../config/coins');

// ── Lazy-load aggregators ──
let _marketService = null;
let _forexAggregator = null;

function getMarketService() {
  if (!_marketService) {
    try {
      _marketService = require('./src/services/market/market.service');
    } catch {
      // Fall back to old aggregator
      _marketService = require('./market/market.aggregator');
    }
  }
  return _marketService;
}

function getForexAggregator() {
  if (!_forexAggregator) {
    _forexAggregator = require('./forexAggregator');
  }
  return _forexAggregator;
}

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
  const trade = await Trade.findOneAndUpdate(
    { _id: tradeId, status: 'pending' },
    { $set: { status: 'pending' } },
    { new: true },
  );
  if (!trade) return;

  const user = await User.findById(trade.userId);
  if (!user) {
    trade.status     = 'cancelled';
    trade.resolvedAt = new Date();
    trade.resolvedBy = 'expired';
    await trade.save();
    return;
  }

  // ── Decide outcome ──
  const mode = typeof user.autoMode === 'string' ? user.autoMode : 'random';
  let win;
  let resolvedBy;
  if (mode === 'alwaysWin')        { win = true;  resolvedBy = 'auto-win';    }
  else if (mode === 'alwaysLose')  { win = false; resolvedBy = 'auto-lose';   }
  else {
    win        = Math.random() < 0.5;
    resolvedBy = win ? 'random-win' : 'random-lose';
  }

  // ── Get exit price ──
  const exitPrice = await fetchPriceForPair(trade.pair, trade.pairClass).catch(() => trade.entryPrice);

  const stake      = Number(trade.stake);
  const multiplier = Number(trade.planMultiplier);
  const fee        = stake * (Number(trade.feeBps) / 10000);

  if (win) {
    const profit    = stake * multiplier;
    const credit    = stake + profit - fee;
    const netResult = profit - fee;
    const safecredit = Math.max(0, credit);

    user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + safecredit;
    user.markModified('balances');
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
    const loss      = stake * multiplier;
    const remaining = stake - loss - fee;
    const netResult = -(loss + fee);

    if (remaining > 0) {
      user.balances[trade.tradingAsset] = (user.balances[trade.tradingAsset] || 0) + remaining;
      user.markModified('balances');
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

function cancelScheduled(tradeId) {
  const id = String(tradeId);
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
}

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

// ── Helper: fetch price from either new market service or old aggregator ──
async function fetchPriceForPair(pair, pairClass) {
  // Try new market service first
  try {
    const marketService = getMarketService();
    
    if (typeof marketService.getPrice === 'function') {
      const result = await marketService.getPrice(pair);
      if (result?.price) return result.price;
    }
    
    // Old aggregator format
    if (typeof marketService.getMarketList === 'function' && pairClass === 'crypto') {
      const { rows } = await marketService.getMarketList();
      const meta = BY_BINANCE[pair];
      if (meta) {
        const row = rows.find((r) => r.symbol === meta.symbol);
        if (row?.price) return row.price;
      }
    }
  } catch (err) {
    console.warn('[tradeResolver] marketService.getPrice failed:', err.message);
  }

  // Try forex aggregator for forex/metals
  if (pairClass === 'forex' || pairClass === 'metals') {
    try {
      const forexAgg = getForexAggregator();
      const { rows } = await forexAgg.getForexAndMetals();
      const row = rows.find((r) => r.symbol === pair);
      if (row?.price) return row.price;
    } catch (err) {
      console.warn('[tradeResolver] forexAggregator failed:', err.message);
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