// controllers/profileController.js
// ── User profile controller with proper file URL handling for capitalcointrade.com ──

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

function getFullAvatarUrl(req, avatarUrl) {
  if (!avatarUrl) return null;
  // If it's already a full URL, return as is
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  // Otherwise, prepend the backend URL
  const baseUrl = process.env.BACKEND_URL || `https://${req.get('host')}`;
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
  return `${cleanBase}${cleanPath}`;
}

function absFromAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;
  // Extract the path part if it's a full URL
  let pathPart = avatarUrl;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    try {
      const urlObj = new URL(avatarUrl);
      pathPart = urlObj.pathname;
    } catch (e) {
      pathPart = avatarUrl;
    }
  }
  const rel = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart;
  return path.resolve(process.env.UPLOAD_DIR || './uploads', rel);
}

// ── GET /api/user/profile ──
async function getProfile(req, res) {
  try {
    const user = req.user.toJSON();
    // Convert relative avatar URL to full URL
    if (user.avatarUrl) {
      user.avatarUrl = getFullAvatarUrl(req, user.avatarUrl);
    }
    return res.status(200).json({ user });
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
    const userJson = user.toJSON();
    if (userJson.avatarUrl) {
      userJson.avatarUrl = getFullAvatarUrl(req, userJson.avatarUrl);
    }
    return res.status(200).json({ message: 'Profile updated', user: userJson });
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

    // Store relative path
    user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    // Return full URL
    const fullUrl = getFullAvatarUrl(req, user.avatarUrl);
    const userJson = user.toJSON();
    userJson.avatarUrl = fullUrl;

    return res.status(200).json({
      message: 'Avatar updated',
      avatarUrl: fullUrl,
      user: userJson,
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
    const userJson = user.toJSON();
    return res.status(200).json({ message: 'Avatar removed', user: userJson });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/user/portfolio ──
async function getPortfolio(req, res) {
  try {
    const user = req.user;

    // Calculate total balance from all currencies
    let totalBalanceUsd = 0;
    const balances = [];

    // Get all currencies from user balances
    for (const [currency, amount] of Object.entries(user.balances || {})) {
      const numAmount = Number(amount);
      if (numAmount > 0) {
        // For now, assume 1 USDT/BTC/ETH = 1 USD for simplicity
        // TODO: Integrate with market service for real-time prices
        const usdValue = currency === 'USDT' ? numAmount : numAmount * 1; // Placeholder
        totalBalanceUsd += usdValue;
        balances.push({
          currency,
          amount: numAmount,
          usdValue,
          pct: 0, // Will calculate after total is known
        });
      }
    }

    // Calculate percentages
    if (totalBalanceUsd > 0) {
      balances.forEach(b => {
        b.pct = (b.usdValue / totalBalanceUsd) * 100;
      });
    }

    return res.status(200).json({
      totalBalanceUsd,
      balances,
      change24h: { absolute: 0, percent: 0 },
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
        network: d.network,
      })),
      ...withdrawals.map((w) => ({
        id: String(w._id),
        type: 'withdrawal',
        amount: w.amount,
        currency: w.currency,
        status: w.status,
        createdAt: w.createdAt,
        network: w.network,
        toAddress: w.toAddress,
      })),
      ...trades.map((t) => ({
        id: String(t._id),
        type: 'trade',
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
        pair: t.pair,
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