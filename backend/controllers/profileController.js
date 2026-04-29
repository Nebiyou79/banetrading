// controllers/profileController.js
// ── User profile controller ──
// Handles profile CRUD, password change, avatar upload/delete,
// portfolio aggregation, and recent-transactions feed.

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Trade = require('../models/Trade');

// ── Helpers ──
function safeUnlink(absPath) {
  if (!absPath) return;
  fs.unlink(absPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('[profileController] Failed to delete file:', absPath, err);
    }
  });
}

function absFromAvatarUrl(avatarUrl) {
  // avatarUrl is stored as `/uploads/avatars/<file>` — resolve against project root
  if (!avatarUrl) return null;
  const rel = avatarUrl.startsWith('/') ? avatarUrl.slice(1) : avatarUrl;
  return path.resolve(process.cwd(), rel);
}

// ── GET /api/user/profile ──
async function getProfile(req, res) {
  try {
    return res.status(200).json({ user: req.user.toJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── PUT /api/user/profile ──
async function updateProfile(req, res) {
  try {
    const { name, displayName, country, phone } = req.body;
    if ('email' in req.body) {
      return res.status(400).json({ message: 'Email cannot be changed from this endpoint' });
    }

    const user = req.user;
    if (typeof name === 'string')        user.name = name.trim();
    if (typeof displayName === 'string') user.displayName = displayName.trim();
    if (typeof country === 'string')     user.country = country.trim();
    if (typeof phone === 'string')       user.phone = phone.trim();

    await user.save();
    return res.status(200).json({ message: 'Profile updated', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── PUT /api/user/change-password ──
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordUpdatedAt = new Date();
    // Invalidate all sessions — forces re-login.
    user.refreshTokenHash = undefined;
    user.refreshTokenIssuedAt = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password changed. Please log in again.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/user/avatar ──
async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = req.user;

    // Delete old file if present (ignore ENOENT)
    if (user.avatarUrl) {
      safeUnlink(absFromAvatarUrl(user.avatarUrl));
    }

    // Store a URL path served by the static /uploads route
    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      message: 'Avatar updated',
      avatarUrl: user.avatarUrl,
      user: user.toJSON(),
    });
  } catch (err) {
    console.error(err);
    // If something failed after the file was written, try to clean it up
    if (req.file && req.file.path) safeUnlink(req.file.path);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── DELETE /api/user/avatar ──
async function deleteAvatar(req, res) {
  try {
    const user = req.user;
    if (user.avatarUrl) {
      safeUnlink(absFromAvatarUrl(user.avatarUrl));
      user.avatarUrl = undefined;
      await user.save();
    }
    return res.status(200).json({ message: 'Avatar removed', user: user.toJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/user/portfolio ──
async function getPortfolio(req, res) {
  try {
    const user = req.user;

    // TODO: replace with per-currency balance tracking once Deposit/Withdrawal module is live
    const usdtAmount = Number(user.balance || 0);
    const totalBalanceUsd = usdtAmount; // assumes 1 USDT ≈ 1 USD

    const balances = [
      {
        currency: 'USDT',
        amount: usdtAmount,
        usdValue: usdtAmount,
        pct: 100,
      },
    ];

    // Placeholder 24h change until live price service is wired in
    const change24h = { absolute: 0, percent: 0 };

    return res.status(200).json({
      totalBalanceUsd,
      balances,
      change24h,
      kyc: { status: user.kycStatus || 'none', tier: user.kycTier || 0 },
      account: {
        isFrozen: !!user.isFrozen,
        verifiedAt: user.emailVerifiedAt || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/user/transactions/recent ──
async function getRecentTransactions(req, res) {
  try {
    const raw = Number.parseInt(String(req.query.limit ?? '10'), 10);
    const limit = Math.min(Math.max(Number.isFinite(raw) ? raw : 10, 1), 50);
    const userId = req.user._id;

    const [deposits, withdrawals, trades] = await Promise.all([
      Deposit.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Trade.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const normalized = [
      ...deposits.map((d) => ({
        id: String(d._id),
        type: 'deposit',
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        createdAt: d.createdAt,
      })),
      ...withdrawals.map((w) => ({
        id: String(w._id),
        type: 'withdrawal',
        amount: w.amount,
        currency: w.currency,
        status: w.status,
        createdAt: w.createdAt,
      })),
      ...trades.map((t) => ({
        id: String(t._id),
        type: 'trade',
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
      })),
    ];

    normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const sliced = normalized.slice(0, limit);

    return res.status(200).json({ transactions: sliced });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
  getPortfolio,
  getRecentTransactions,
};