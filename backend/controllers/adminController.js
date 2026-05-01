// controllers/adminController.js
// ── Admin controller (Module 3 scope) ──
// Owns approve/reject flows for deposits and withdrawals. Crediting and
// refunding live here — fundsController only HOLDS funds at submit time.
//
// Balance rules:
//   • approveDeposit    → user.balances[deposit.currency] += deposit.amount
//   • rejectDeposit     → no balance change (deposit was never credited)
//   • approveWithdrawal → no balance change (already debited at submit)
//   • rejectWithdrawal  → user.balances[withdrawal.currency] += withdrawal.amount (refund)

const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const promoBonusService = require('../services/promoBonusService');

// ── GET /api/admin/deposits ──
async function listDeposits(req, res) {
  try {
    const status = req.query.status && ['pending', 'approved', 'rejected'].includes(String(req.query.status))
      ? String(req.query.status)
      : undefined;
    const currency = req.query.currency && ['USDT', 'BTC', 'ETH'].includes(String(req.query.currency).toUpperCase())
      ? String(req.query.currency).toUpperCase()
      : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip  = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (currency) filter.currency = currency;

    // If search is provided, we need to filter by user email/name.
    // We first find matching user IDs, then add them to the filter.
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();
      
      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length === 0) {
        // No matching users — return empty
        return res.status(200).json({ deposits: [], total: 0 });
      }
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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/admin/withdrawals ──
async function listWithdrawals(req, res) {
  try {
    const status = req.query.status && ['pending', 'approved', 'rejected'].includes(String(req.query.status))
      ? String(req.query.status)
      : undefined;
    const currency = req.query.currency && ['USDT', 'BTC', 'ETH'].includes(String(req.query.currency).toUpperCase())
      ? String(req.query.currency).toUpperCase()
      : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip  = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (currency) filter.currency = currency;

    // If search is provided, filter by user email/name
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      }).select('_id').lean();
      
      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length === 0) {
        return res.status(200).json({ withdrawals: [], total: 0 });
      }
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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/deposits/:id/approve ──
async function approveDeposit(req, res) {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: `Deposit is already ${deposit.status}` });
    }

    const user = await User.findById(deposit.userId);
    if (!user) return res.status(404).json({ message: 'Depositor not found' });

    deposit.status = 'approved';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    // PATCHED: use per-currency balances map (Module 6)
    user.balances[deposit.currency] = (user.balances[deposit.currency] || 0) + Number(deposit.amount);
    await user.save();

    // ── Module 8: Check deposit bonus milestone (non-blocking) ──
    try {
      const depositOwner = await User.findById(deposit.userId).select('promoCodeUsed');
      if (depositOwner?.promoCodeUsed) {
        await promoBonusService.checkAndCreditDepositBonus(depositOwner.promoCodeUsed);
      }
    } catch (bonusErr) {
      console.error('[promoBonus] deposit bonus check failed (non-blocking):', bonusErr.message);
    }

    return res.status(200).json({
      message: 'Deposit approved and balance credited',
      deposit,
      newBalances: user.balances,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/deposits/:id/reject ──
async function rejectDeposit(req, res) {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: `Deposit is already ${deposit.status}` });
    }

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    deposit.status = 'rejected';
    deposit.rejectionReason = reason || 'Rejected by admin';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    // No balance change — deposit was never credited.
    return res.status(200).json({ message: 'Deposit rejected', deposit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/withdrawals/:id/approve ──
async function approveWithdrawal(req, res) {
  try {
    const w = await Withdrawal.findById(req.params.id);
    if (!w) return res.status(404).json({ message: 'Withdrawal not found' });
    if (w.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal is already ${w.status}` });
    }

    const txHash = typeof req.body?.txHash === 'string' ? req.body.txHash.trim().slice(0, 200) : '';

    w.status = 'approved';
    w.reviewedBy = req.user._id;
    w.reviewedAt = new Date();
    if (txHash) w.txHash = txHash;
    await w.save();

    // Balance was debited at submit-time; nothing else to do here.
    return res.status(200).json({ message: 'Withdrawal approved', withdrawal: w });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/admin/withdrawals/:id/reject ──
async function rejectWithdrawal(req, res) {
  try {
    const w = await Withdrawal.findById(req.params.id);
    if (!w) return res.status(404).json({ message: 'Withdrawal not found' });
    if (w.status !== 'pending') {
      return res.status(400).json({ message: `Withdrawal is already ${w.status}` });
    }

    const user = await User.findById(w.userId);
    if (!user) return res.status(404).json({ message: 'Withdrawer not found' });

    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    w.status = 'rejected';
    w.rejectionReason = reason || 'Rejected by admin';
    w.reviewedBy = req.user._id;
    w.reviewedAt = new Date();
    await w.save();

    // PATCHED: use per-currency balances map (Module 6)
    user.balances[w.currency] = (user.balances[w.currency] || 0) + Number(w.amount);
    await user.save();

    return res.status(200).json({
      message: 'Withdrawal rejected and balance refunded',
      withdrawal: w,
      newBalances: user.balances,
    });
  } catch (err) {
    console.error(err);
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