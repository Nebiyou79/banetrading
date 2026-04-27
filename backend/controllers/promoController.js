// controllers/promoController.js
// ── Promo code controller ──

const PromoCode = require('../models/PromoCode');
const User = require('../models/User');

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

// ── GET /api/promo/me ──
async function getMine(req, res) {
  try {
    const user = req.user;
    let promo = null;
    if (user.ownPromoCode) {
      promo = await PromoCode.findOne({ code: user.ownPromoCode });
    }
    return res.status(200).json({
      ownPromoCode: user.ownPromoCode || null,
      referralCount: user.referralCount || 0,
      bonusUnlocked: !!user.bonusUnlocked,
      bonusThreshold: promo?.bonusThreshold || 25,
      usageCount: promo?.usageCount || 0,
      isActive: promo?.isActive ?? null,
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
      // eslint-disable-next-line no-await-in-loop
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

module.exports = {
  validateCode,
  getMine,
  generateMine,
  adminListAll,
  adminUpdate,
};