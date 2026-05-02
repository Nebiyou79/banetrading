// controllers/adminUserController.js
// ── Admin user management controller ──

const User = require('../models/User');

// ── GET /api/admin/users ──
async function listUsers(req, res) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'newest';
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 200);
    const skip = Math.max(Number.parseInt(String(req.query.skip ?? '0'), 10) || 0, 0);

    // ── Build filter ──
    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    // ── Build sort ──
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'balanceDesc':
        sort = { balance: -1 };
        break;
      case 'balanceAsc':
        sort = { balance: 1 };
        break;
      case 'nameAsc':
        sort = { name: 1 };
        break;
      case 'nameDesc':
        sort = { name: -1 };
        break;
      case 'newest':
      default:
        sort = { createdAt: -1 };
        break;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Remove sensitive fields from each user
    const sanitized = users.map((u) => {
      delete u.password;
      delete u.refreshTokenHash;
      delete u.refreshTokenIssuedAt;
      delete u.otpHash;
      delete u.otpExpires;
      delete u.otpPurpose;
      delete u.otpAttempts;
      delete u.otpLastSentAt;
      delete u.passwordResetToken;
      delete u.passwordResetExpires;
      return u;
    });

    return res.status(200).json({ users: sanitized, total });
  } catch (err) {
    console.error('[adminUser] listUsers error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── PATCH /api/admin/users/:userId ──
async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, role, kycTier, isFrozen, freezeReason, autoMode, balance } = req.body;

    // ── Allowable updates ──
    if (typeof name === 'string') user.name = name.trim();
    if (typeof email === 'string') user.email = email.trim().toLowerCase();

    // Role change — protect admins from being demoted by themselves
    if (role === 'admin' || role === 'user') {
      if (user._id.toString() === req.user._id.toString() && role !== user.role) {
        return res.status(403).json({ message: 'Cannot change your own role' });
      }
      user.role = role;
    }

    if (typeof kycTier === 'number' && kycTier >= 1 && kycTier <= 3) {
      user.kycTier = kycTier;
    }

    // ── Freeze / unfreeze ──
    if (typeof isFrozen === 'boolean') {
      if (isFrozen && !user.isFrozen) {
        if (!freezeReason || typeof freezeReason !== 'string' || !freezeReason.trim()) {
          return res.status(400).json({ message: 'freezeReason is required when freezing an account' });
        }
        user.isFrozen = true;
        user.freezeReason = freezeReason.trim().slice(0, 500);
      } else if (!isFrozen && user.isFrozen) {
        user.isFrozen = false;
        user.freezeReason = undefined;
      }
    }

    // ── Auto mode ──
    if (typeof autoMode === 'string' && ['off', 'random', 'alwaysWin', 'alwaysLose'].includes(autoMode)) {
      user.autoMode = autoMode;
    }

    // ── Balance updates (NEW) ──
    // Support both legacy "balance" and per-currency "balances.XXX"
    if (typeof balance === 'number' && balance >= 0) {
      // Legacy balance field (USDT)
      user.balance = balance;
      if (!user.balances) user.balances = {};
      user.balances.USDT = balance;
    }

    // Support per-currency balance updates
    const currencies = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
    for (const currency of currencies) {
      const balanceKey = `balances.${currency}`;
      if (req.body[balanceKey] !== undefined) {
        const val = Number(req.body[balanceKey]);
        if (Number.isFinite(val) && val >= 0) {
          if (!user.balances) user.balances = {};
          user.balances[currency] = val;
          // Sync legacy balance if updating USDT
          if (currency === 'USDT') {
            user.balance = val;
          }
        }
      }
    }

    await user.save();

    return res.status(200).json({
      message: 'User updated',
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('[adminUser] updateUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── DELETE /api/admin/users/:userId ──
async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deletion of admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.userId);

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('[adminUser] deleteUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { listUsers, updateUser, deleteUser };