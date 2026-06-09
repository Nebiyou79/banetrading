// services/tradeResolver.js
// ── TRADE RESOLVER ──
//
// BALANCE MODEL (matches tradeController.js):
//   PLACEMENT:  full stake deducted from balance
//
//   WIN:  risk = stake × multiplier
//         fee  = risk × feeRate
//         netGain    = risk - fee
//         credit     = stake + netGain        ← stake returned + profit minus fee
//
//   LOSS: risk = stake × multiplier
//         fee  = risk × feeRate
//         totalLoss  = risk + fee
//         credit     = stake - totalLoss      ← stake returned minus risk+fee
//                    = Math.max(0, stake - totalLoss)  (never go negative)
//
// Examples (stake=100, multiplier=0.12, feeBps=200):
//   risk=12, fee=0.24
//   WIN:  credit = 100 + (12-0.24) = 111.76  (net gain = +11.76)
//   LOSS: credit = 100 - (12+0.24) = 87.76   (net loss = -12.24)

const Trade = require('../models/Trade');
const User  = require('../models/User');

// Pending resolution timers: tradeId → setTimeout handle
const pendingTimers = new Map();

/**
 * Determine outcome for a trade.
 * autoMode: 'alwaysWin' | 'alwaysLose' | 'off' | 'random'
 */
function determineOutcome(autoMode) {
  if (autoMode === 'alwaysWin')  return 'won';
  if (autoMode === 'alwaysLose') return 'lost';
  // 'off' and 'random' both use random 50/50
  return Math.random() < 0.5 ? 'won' : 'lost';
}

/**
 * Compute credit amount and trade financials.
 * Returns amounts to credit back to the user's balance.
 */
function computeSettlement(trade, outcome) {
  const stake      = trade.stake;
  const multiplier = trade.planMultiplier;
  const feeRate    = trade.feeBps / 10_000;

  const risk    = stake * multiplier;
  const fee     = risk * feeRate;

  if (outcome === 'won') {
    const netGain = risk - fee;
    const credit  = stake + netGain;
    return {
      credit,
      payout:     credit,
      netResult:  +netGain,
      feeAmount:  fee,
      resolvedBy: 'random-win',
    };
  } else {
    const totalLoss = risk + fee;
    const credit    = Math.max(0, stake - totalLoss);
    return {
      credit,
      payout:     0,
      netResult:  -(totalLoss),
      feeAmount:  fee,
      resolvedBy: 'random-lose',
    };
  }
}

/**
 * Resolve a single trade — called when its timer fires.
 */
async function resolveTrade(tradeId) {
  pendingTimers.delete(tradeId);

  try {
    // Re-fetch fresh from DB (timer may have fired well after placement)
    const trade = await Trade.findById(tradeId);
    if (!trade || trade.status !== 'pending') return;

    const user = await User.findById(trade.userId);
    if (!user) {
      console.error(`[tradeResolver] User not found for trade ${tradeId}`);
      return;
    }

    // Determine outcome
    const autoMode = user.autoMode || 'random';
    const outcome  = determineOutcome(autoMode);

    // Compute settlement
    const settlement = computeSettlement(trade, outcome);

    // Credit balance atomically using $inc to avoid race conditions
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { 'balances.USDT': settlement.credit } },
      { new: true }
    );

    // Mark trade resolved
    trade.status     = outcome;
    trade.resolvedAt = new Date();
    trade.payout     = settlement.payout;
    trade.netResult  = settlement.netResult;
    trade.feeAmount  = settlement.feeAmount;
    trade.resolvedBy = settlement.resolvedBy;
    await trade.save();

    console.log(
      `[tradeResolver] ${tradeId} → ${outcome.toUpperCase()} | ` +
      `stake=${trade.stake} risk=${(trade.stake * trade.planMultiplier).toFixed(4)} ` +
      `credit=${settlement.credit.toFixed(4)} netResult=${settlement.netResult.toFixed(4)}`
    );

    // Notify via WebSocket if available
    notifyUser(trade.userId.toString(), trade);

  } catch (err) {
    console.error(`[tradeResolver] Error resolving trade ${tradeId}:`, err.message);
  }
}

/**
 * Schedule a trade for resolution at its expiresAt time.
 * Safe to call multiple times — duplicate schedules are ignored.
 */
function scheduleResolution(trade) {
  const id = trade._id.toString();

  if (pendingTimers.has(id)) return; // already scheduled

  const msUntilExpiry = new Date(trade.expiresAt).getTime() - Date.now();

  if (msUntilExpiry <= 0) {
    // Already expired — resolve immediately (next tick)
    setImmediate(() => resolveTrade(id));
    return;
  }

  const timer = setTimeout(() => resolveTrade(id), msUntilExpiry);
  // Allow process to exit even with pending timers
  if (timer.unref) timer.unref();
  pendingTimers.set(id, timer);

  console.log(`[tradeResolver] Scheduled ${id} in ${Math.round(msUntilExpiry / 1000)}s`);
}

/**
 * On server boot: recover any trades that are still pending but their
 * expiresAt has passed (e.g. server was restarted mid-trade).
 */
async function recoverPendingTrades() {
  try {
    const expired = await Trade.find({
      status:    'pending',
      expiresAt: { $lte: new Date() },
    });

    let immediate = 0, rescheduled = 0;

    for (const trade of expired) {
      const msLeft = new Date(trade.expiresAt).getTime() - Date.now();
      if (msLeft <= 0) {
        setImmediate(() => resolveTrade(trade._id.toString()));
        immediate++;
      } else {
        scheduleResolution(trade);
        rescheduled++;
      }
    }

    // Also re-schedule trades that are still pending but not yet expired
    const stillPending = await Trade.find({
      status:    'pending',
      expiresAt: { $gt: new Date() },
    });

    for (const trade of stillPending) {
      scheduleResolution(trade);
      rescheduled++;
    }

    console.log(`[tradeResolver] boot recovery: ${immediate} resolved immediately, ${rescheduled} rescheduled`);
  } catch (err) {
    console.error('[tradeResolver] recoverPendingTrades error:', err.message);
  }
}

// ── WebSocket notification (optional) ──
let _wsBroadcast = null;
function setWsBroadcast(fn) { _wsBroadcast = fn; }

function notifyUser(userId, trade) {
  if (!_wsBroadcast) return;
  try {
    _wsBroadcast(userId, { type: 'trade_resolved', trade });
  } catch {}
}

// Run recovery on module load
recoverPendingTrades();

module.exports = {
  scheduleResolution,
  recoverPendingTrades,
  setWsBroadcast,
  // Exported for testing
  computeSettlement,
  determineOutcome,
};