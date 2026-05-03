// controllers/adminController.js
// ── Admin controller — deposit/withdrawal approval ──
//
// BALANCE FIX:
// 1. approveDeposit:   wrapped in Mongoose session for atomicity + markModified.
// 2. approveWithdrawal: clears lockedBalances[currency] when approved (funds leave platform).
// 3. rejectWithdrawal:  refunds gross to balances, clears lockedBalances, markModified on both.
// 4. All balance mutations call markModified so Mongoose reliably persists nested changes.
//
// Balance rules enforced here (complements fundsController):
//   approveDeposit    → balances[currency]       += deposit.amount
//   rejectDeposit     → no balance change
//   approveWithdrawal → lockedBalances[currency]  -= withdrawal.amount  (funds leave)
//   rejectWithdrawal  → balances[currency]        += withdrawal.amount  (refund)
//                        lockedBalances[currency]  -= withdrawal.amount  (release lock)

const mongoose = require('mongoose');
const Deposit    = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const User       = require('../models/User');
const promoBonusService = require('../services/promoBonusService');

// ── GET /api/admin/deposits ──
async function listDeposits(req, res) {
  try {
    const status   = req.query.status && ['pending', 'approved', 'rejected'].includes(String(req.query.status))
      ? String(req.query.status) : undefined;
    const currency = req.query.currency && ['USDT', 'BTC', 'ETH'].includes(String(req.query.currency).toUpperCase())
      ? String(req.query.currency).toUpperCase() : undefined;
    const search   = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit    = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip     = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    const filter = {};
    if (status)   filter.status   = status;
    if (currency) filter.currency = currency;

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name:  { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();

      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length === 0) return res.status(200).json({ deposits: [], total: 0 });
      filter.userId = { $in: userIds };
    }

    const [items, total] = await Promise.all([
      Deposit.find(filter)
        .populate('userId', 'email name displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Deposit.countDocuments(filter),
    ]);

    return res.status(200).json({ deposits: items, total });
  } catch (err) {
    console.error('[adminController] listDeposits:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/admin/withdrawals ──
async function listWithdrawals(req, res) {
  try {
    const status   = req.query.status && ['pending', 'approved', 'rejected'].includes(String(req.query.status))
      ? String(req.query.status) : undefined;
    const currency = req.query.currency && ['USDT', 'BTC', 'ETH'].includes(String(req.query.currency).toUpperCase())
      ? String(req.query.currency).toUpperCase() : undefined;
    const search   = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit    = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip     = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    const filter = {};
    if (status)   filter.status   = status;
    if (currency) filter.currency = currency;

    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name:  { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();

      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length === 0) return res.status(200).json({ withdrawals: [], total: 0 });
      filter.userId = { $in: userIds };
    }

    const [items, total] = await Promise.all([
      Withdrawal.find(filter)
        .populate('userId', 'email name displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Withdrawal.countDocuments(filter),
    ]);

    return res.status(200).json({ withdrawals: items, total });
  } catch (err) {
    console.error('[adminController] listWithdrawals:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/deposits/:id/approve ──
// Credits user.balances[currency] after atomic session update.
// Uses Mongoose session where replica set is available; falls back gracefully.
async function approveDeposit(req, res) {
  let session = null;
  try {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null; // standalone mongod — proceed without transaction
    }

    const deposit = session
      ? await Deposit.findById(req.params.id).session(session)
      : await Deposit.findById(req.params.id);

    if (!deposit) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ message: 'Deposit not found' });
    }
    if (deposit.status !== 'pending') {
      if (session) await session.abortTransaction();
      return res.status(400).json({ message: `Deposit is already ${deposit.status}` });
    }

    const user = session
      ? await User.findById(deposit.userId).session(session)
      : await User.findById(deposit.userId);

    if (!user) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ message: 'Depositor not found' });
    }

    // Update deposit status first
    deposit.status     = 'approved';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save({ session });

    // Credit the available balance
    user.balances[deposit.currency] = (user.balances[deposit.currency] || 0) + Number(deposit.amount);
    user.markModified('balances');
    await user.save({ session });

    if (session) await session.commitTransaction();

    // ── Check deposit bonus milestone (non-blocking, outside transaction) ──
    try {
      const depositOwner = await User.findById(deposit.userId).select('promoCodeUsed');
      if (depositOwner?.promoCodeUsed) {
        await promoBonusService.checkAndCreditDepositBonus(depositOwner.promoCodeUsed);
      }
    } catch (bonusErr) {
      console.error('[promoBonus] deposit bonus check failed (non-blocking):', bonusErr.message);
    }

    return res.status(200).json({
      message:     'Deposit approved and balance credited',
      deposit,
      newBalances: user.balances,
    });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    console.error('[adminController] approveDeposit:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (session) {
      try { await session.endSession(); } catch { /* ignore */ }
    }
  }
}

// ── POST /api/admin/deposits/:id/reject ──
// No balance change — deposit was never credited.
async function rejectDeposit(req, res) {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: `Deposit is already ${deposit.status}` });
    }

    const reason      = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    deposit.status    = 'rejected';
    deposit.rejectionReason = reason || 'Rejected by admin';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    return res.status(200).json({ message: 'Deposit rejected', deposit });
  } catch (err) {
    console.error('[adminController] rejectDeposit:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/withdrawals/:id/approve ──
// Balance was already debited at submit time and moved to lockedBalances.
// On approval: clear the lock (funds physically leave the platform).
// No re-credit to balances — the debit was final.
async function approveWithdrawal(req, res) {
  try {
    const w = await Withdrawal.findById(req.params.id);
    if (!w) return res.status(404).json({ message: 'Withdrawal not found' });
    if (w.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal is already ${w.status}` });
    }

    // Clear the locked amount — funds leave the platform
    const user = await User.findById(w.userId);
    if (user) {
      const currentLocked = Number(user.lockedBalances?.[w.currency] || 0);
      user.lockedBalances[w.currency] = Math.max(0, currentLocked - Number(w.amount));
      user.markModified('lockedBalances');
      await user.save();
    }

    const txHash = typeof req.body?.txHash === 'string' ? req.body.txHash.trim().slice(0, 200) : '';
    w.status     = 'approved';
    w.reviewedBy = req.user._id;
    w.reviewedAt = new Date();
    if (txHash) w.txHash = txHash;
    await w.save();

    return res.status(200).json({ message: 'Withdrawal approved', withdrawal: w });
  } catch (err) {
    console.error('[adminController] approveWithdrawal:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/withdrawals/:id/reject ──
// Refunds the gross amount back to available balance AND releases the lock.
async function rejectWithdrawal(req, res) {
  try {
    const w = await Withdrawal.findById(req.params.id);
    if (!w) return res.status(404).json({ message: 'Withdrawal not found' });
    if (w.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal is already ${w.status}` });
    }

    const user = await User.findById(w.userId);
    if (!user) return res.status(404).json({ message: 'Withdrawer not found' });

    const reason      = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    w.status          = 'rejected';
    w.rejectionReason = reason || 'Rejected by admin';
    w.reviewedBy      = req.user._id;
    w.reviewedAt      = new Date();
    await w.save();

    // Refund gross amount to available balance
    user.balances[w.currency] = (user.balances[w.currency] || 0) + Number(w.amount);

    // Release the lock
    const currentLocked = Number(user.lockedBalances?.[w.currency] || 0);
    user.lockedBalances[w.currency] = Math.max(0, currentLocked - Number(w.amount));

    // markModified on both — Mongoose won't detect nested object mutations otherwise
    user.markModified('balances');
    user.markModified('lockedBalances');
    await user.save();

    return res.status(200).json({
      message:        'Withdrawal rejected and balance refunded',
      withdrawal:     w,
      newBalances:    user.balances,
      lockedBalances: user.lockedBalances,
    });
  } catch (err) {
    console.error('[adminController] rejectWithdrawal:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listDeposits,
  listWithdrawals,
  approveDeposit,
  rejectDeposit,
  approveWithdrawal,
  rejectWithdrawal,
};