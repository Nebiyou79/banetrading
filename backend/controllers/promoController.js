// controllers/promoController.js
// ── Promo code controller (extended with Module 8: leaderboard, referrals, grants) ──

const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const BonusGrant = require('../models/BonusGrant');
const Deposit = require('../models/Deposit');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes ambiguous chars
const OWN_CODE_LEN = 8;

function randomCode(len = OWN_CODE_LEN) {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// ── GET /api/promo/validate/:code ──
async function validateCode(req, res) {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code || code.length < 6 || code.length > 12) {
      return res.status(200).json({ valid: false, reason: 'format' });
    }
    const promo = await PromoCode.findOne({ code });
    if (!promo) return res.status(200).json({ valid: false, reason: 'not_found' });
    if (!promo.isActive) return res.status(200).json({ valid: false, reason: 'inactive' });
    return res.status(200).json({ valid: true, code: promo.code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/promo/me (extended with Module 8 stats) ──
async function getMine(req, res) {
  try {
    const user = req.user;
    let promo = null;
    if (user.ownPromoCode) {
      promo = await PromoCode.findOne({ code: user.ownPromoCode });
    }

    if (!promo) {
      return res.json({
        code: null,
        hasCode: false,
        ownPromoCode: null,
        referralCount: user.referralCount || 0,
        bonusUnlocked: !!user.bonusUnlocked,
        usageCount: 0,
        isActive: null,
        signupCount: 0,
        depositorCount: 0,
        signupBonusGranted: false,
        signupBonusGrantedAt: null,
        depositBonusGranted: false,
        depositBonusGrantedAt: null,
        signupThreshold: 25,
        depositThreshold: 25,
        signupBonusUsd: 50,
        depositBonusUsd: 150,
        totalBonusEarnedUsd: 0,
      });
    }

    const code = promo.code;

    // ── Signup count (email-verified users who used this code) ──
    const signupCount = await User.countDocuments({
      promoCodeUsed: code,
      isEmailVerified: true,
    });

    // ── Depositor count (distinct users with approved deposits) ──
    const referredUserIds = await User.distinct('_id', {
      promoCodeUsed: code,
      isEmailVerified: true,
    });
    const depositorCount = referredUserIds.length > 0
      ? (await Deposit.distinct('userId', {
          userId: { $in: referredUserIds },
          status: 'approved',
        })).length
      : 0;

    // ── Total bonus earned ──
    const grants = await BonusGrant.find({ userId: user._id });
    const totalBonusEarnedUsd = grants.reduce((sum, g) => sum + g.amountUsd, 0);

    return res.json({
      code,
      hasCode: true,
      ownPromoCode: code,
      referralCount: user.referralCount || 0,
      bonusUnlocked: !!user.bonusUnlocked,
      usageCount: promo.usageCount || 0,
      isActive: promo.isActive,
      signupCount,
      depositorCount,
      signupBonusGranted: promo.signupBonusGranted || false,
      signupBonusGrantedAt: promo.signupBonusGrantedAt || null,
      depositBonusGranted: promo.depositBonusGranted || false,
      depositBonusGrantedAt: promo.depositBonusGrantedAt || null,
      signupThreshold: promo.signupThreshold || 25,
      depositThreshold: promo.depositThreshold || 25,
      signupBonusUsd: promo.signupBonusUsd || 50,
      depositBonusUsd: promo.depositBonusUsd || 150,
      totalBonusEarnedUsd,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── POST /api/promo/generate ──
async function generateMine(req, res) {
  try {
    const user = req.user;

    if (user.ownPromoCode) {
      const existing = await PromoCode.findOne({ code: user.ownPromoCode });
      return res.status(200).json({
        code: user.ownPromoCode,
        usageCount: existing?.usageCount || 0,
        bonusThreshold: existing?.bonusThreshold || 25,
        isActive: existing?.isActive ?? true,
      });
    }

    // Uniqueness-checked loop
    let code = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = randomCode();
      const clash = await PromoCode.findOne({ code: candidate });
      if (!clash) { code = candidate; break; }
    }
    if (!code) return res.status(500).json({ message: 'Could not generate a unique code. Please try again.' });

    const promo = await PromoCode.create({
      code,
      ownerUserId: user._id,
      createdBy: user._id,
      isActive: true,
      bonusThreshold: 25,
      signupThreshold: 25,
      depositThreshold: 25,
      signupBonusUsd: 50,
      depositBonusUsd: 150,
    });
    user.ownPromoCode = code;
    await user.save();

    return res.status(201).json({
      code: promo.code,
      usageCount: promo.usageCount,
      bonusThreshold: promo.bonusThreshold,
      isActive: promo.isActive,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/promo/leaderboard (Module 8) ──
async function getLeaderboard(req, res) {
  try {
    const promos = await PromoCode.find({ isActive: true, usageCount: { $gt: 0 } })
      .sort({ usageCount: -1 })
      .limit(10)
      .lean();

    const leaderboard = [];
    for (let i = 0; i < promos.length; i++) {
      const p = promos[i];
      const signupCount = await User.countDocuments({
        promoCodeUsed: p.code,
        isEmailVerified: true,
      });
      const referredIds = await User.distinct('_id', {
        promoCodeUsed: p.code,
        isEmailVerified: true,
      });
      const depositorCount = referredIds.length > 0
        ? (await Deposit.distinct('userId', {
            userId: { $in: referredIds },
            status: 'approved',
          })).length
        : 0;

      leaderboard.push({
        rank: i + 1,
        codeMasked: p.code.slice(0, 4) + '****',
        signupCount,
        depositorCount,
        isCurrentUser: req.user && p.ownerUserId
          ? p.ownerUserId.toString() === req.user._id.toString()
          : false,
      });
    }

    return res.json({ leaderboard });
  } catch (err) {
    console.error('[promo] getLeaderboard error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/promo/my-referrals (Module 8) ──
async function getMyReferrals(req, res) {
  try {
    const user = req.user;
    const promo = await PromoCode.findOne({ ownerUserId: user._id });
    if (!promo) return res.json({ referrals: [] });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const referrals = await User.find({
      promoCodeUsed: promo.code,
      isEmailVerified: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name createdAt')
      .lean();

    const result = await Promise.all(
      referrals.map(async (r) => {
        const hasDeposited = !!(await Deposit.findOne({
          userId: r._id,
          status: 'approved',
        }));
        const nameParts = (r.name || '').trim().split(/\s+/);
        const initials =
          nameParts.length >= 2
            ? `${nameParts[0][0]}.${nameParts[1][0]}.`
            : nameParts[0]
              ? `${nameParts[0][0]}.`
              : '?';
        return {
          initials,
          signedUpAt: r.createdAt,
          hasDeposited,
        };
      }),
    );

    return res.json({ referrals: result });
  } catch (err) {
    console.error('[promo] getMyReferrals error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/promo/admin/all ──
async function adminListAll(_req, res) {
  try {
    const codes = await PromoCode.find({})
      .populate('ownerUserId', 'email name')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ codes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── PATCH /api/promo/admin/:code ──
async function adminUpdate(req, res) {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    const promo = await PromoCode.findOne({ code });
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });

    const { isActive, bonusThreshold } = req.body || {};
    if (typeof isActive === 'boolean') promo.isActive = isActive;
    if (typeof bonusThreshold === 'number' && bonusThreshold >= 1) promo.bonusThreshold = bonusThreshold;

    await promo.save();

    // Recompute bonusUnlocked for owner if threshold changed
    if (promo.ownerUserId) {
      const owner = await User.findById(promo.ownerUserId);
      if (owner) {
        const unlocked = (owner.referralCount || 0) >= promo.bonusThreshold;
        if (owner.bonusUnlocked !== unlocked) {
          owner.bonusUnlocked = unlocked;
          await owner.save();
        }
      }
    }

    return res.status(200).json({ message: 'Updated', code: promo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── GET /api/promo/admin/grants (Module 8) ──
async function adminGetGrants(_req, res) {
  try {
    const grants = await BonusGrant.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .lean();
    return res.json({ grants });
  } catch (err) {
    console.error('[promo] adminGetGrants error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  validateCode,
  getMine,
  generateMine,
  getLeaderboard,
  getMyReferrals,
  adminListAll,
  adminUpdate,
  adminGetGrants,
};