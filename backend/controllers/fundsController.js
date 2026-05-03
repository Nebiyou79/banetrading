// controllers/fundsController.js
// Funds controller
//
// BALANCE FIX:
// 1. getBalance: returns both balances (available) and lockedBalances (pending withdrawal).
// 2. withdrawFunds: moves gross amount from balances to lockedBalances on submit.
//    markModified called on both maps so Mongoose persists nested object changes.
// 3. depositFunds: no balance change at submit (admin approval credits balance).
//
// Balance accounting:
//   Available balance  = user.balances[currency]       (ready to spend)
//   Locked balance     = user.lockedBalances[currency]  (pending withdrawal)
//   Withdrawal check   uses available only
//   Conversion check   uses available only

const fs = require('fs');

const User       = require('../models/User');
const Deposit    = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const NetworkFee = require('../models/NetworkFee');
const { isValidDepositCombo, isValidWithdrawCombo } = require('../utils/coinNetwork');

function safeUnlink(absPath) {
  if (!absPath) return;
  fs.unlink(absPath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('[fundsController] unlink failed:', absPath, err);
  });
}

// GET /api/funds/balance
async function getBalance(req, res) {
  try {
    const user = req.user;

    const lockedBalances = user.lockedBalances || {
      USDT: 0, BTC: 0, ETH: 0, SOL: 0, BNB: 0, XRP: 0,
    };

    return res.status(200).json({
      balances:       user.balances,
      lockedBalances,
      currency:       'multi',
      isFrozen:       !!user.isFrozen,
    });
  } catch (err) {
    console.error('[fundsController] getBalance:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/funds/deposit
async function depositFunds(req, res) {
  try {
    if (req.user.isFrozen) {
      if (req.file && req.file.path) safeUnlink(req.file.path);
      return res.status(403).json({ message: req.user.freezeReason || 'Account is frozen' });
    }

    const { amount, currency, network, note } = req.body;
    const numericAmount = Number(amount);

    // DEBUG LOG - shows exactly what the server receives from the frontend.
    // Remove once deposits are confirmed working.
    console.log('[depositFunds] received body:', { currency, network, amount });

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      if (req.file && req.file.path) safeUnlink(req.file.path);
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Validates (currency, network) is an allowed combination.
    // Both must use the unified format: currency='USDT', network='USDT-ERC20' etc.
    if (!isValidDepositCombo(currency, network)) {
      if (req.file && req.file.path) safeUnlink(req.file.path);
      console.error('[depositFunds] invalid combo:', { currency, network });
      return res.status(400).json({
        message: `Network "${network}" is not valid for ${currency}. Expected one of: USDT-ERC20, USDT-TRC20, USDT-BEP20, BTC, ETH`,
      });
    }

    const proofPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const deposit = await Deposit.create({
      userId:        req.user._id,
      amount:        numericAmount,
      currency,
      network,
      note:          typeof note === 'string' && note.trim() ? note.trim() : undefined,
      proofFilePath: proofPath,
      status:        'pending',
    });

    return res.status(201).json({
      message: 'Deposit submitted, pending review',
      deposit,
    });
  } catch (err) {
    console.error('[fundsController] depositFunds:', err);
    if (req.file && req.file.path) safeUnlink(req.file.path);
    return res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/funds/withdraw
async function withdrawFunds(req, res) {
  try {
    if (req.user.isFrozen) {
      return res.status(403).json({ message: req.user.freezeReason || 'Account is frozen' });
    }

    const { amount, currency, network, toAddress, note } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }
    if (!isValidWithdrawCombo(currency, network)) {
      return res.status(400).json({ message: 'Selected network is not valid for this coin' });
    }
    if (!toAddress || typeof toAddress !== 'string' || toAddress.trim().length < 8) {
      return res.status(400).json({ message: 'Destination address is required' });
    }

    const feeDoc = await NetworkFee.findOne({ network });
    if (!feeDoc) {
      return res.status(404).json({ message: 'Network fee not configured. Please contact support.' });
    }
    const fee = Number(feeDoc.fee || 0);

    if (numericAmount <= fee) {
      return res.status(400).json({ message: `Amount must be greater than the network fee (${fee}).` });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const available = Number(user.balances[currency] || 0);
    if (available < numericAmount) {
      return res.status(400).json({
        message: `Insufficient ${currency} balance. Available: ${available}`,
      });
    }

    const netAmount = Math.max(0, numericAmount - fee);

    // Move gross from available into locked
    user.balances[currency]       = available - numericAmount;
    user.lockedBalances[currency] = (user.lockedBalances[currency] || 0) + numericAmount;

    // CRITICAL: markModified so Mongoose detects nested object mutations
    user.markModified('balances');
    user.markModified('lockedBalances');
    await user.save();

    const withdrawal = await Withdrawal.create({
      userId:     user._id,
      amount:     numericAmount,
      currency,
      network,
      toAddress:  toAddress.trim(),
      networkFee: fee,
      netAmount,
      note:       typeof note === 'string' && note.trim() ? note.trim() : undefined,
      status:     'pending',
    });

    return res.status(201).json({
      message:        'Withdrawal submitted, pending review',
      withdrawal,
      newBalances:    user.balances,
      lockedBalances: user.lockedBalances,
    });
  } catch (err) {
    console.error('[fundsController] withdrawFunds:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/funds/deposits/me
async function getMyDeposits(req, res) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
    const skip  = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    const [items, total] = await Promise.all([
      Deposit.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Deposit.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({ deposits: items, total });
  } catch (err) {
    console.error('[fundsController] getMyDeposits:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/funds/withdrawals/me
async function getMyWithdrawals(req, res) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 100);
    const skip  = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    const [items, total] = await Promise.all([
      Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Withdrawal.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({ withdrawals: items, total });
  } catch (err) {
    console.error('[fundsController] getMyWithdrawals:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getBalance,
  depositFunds,
  withdrawFunds,
  getMyDeposits,
  getMyWithdrawals,
};