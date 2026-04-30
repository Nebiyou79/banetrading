// services/promoBonusService.js
// ── Promo bonus milestone credit service ──
// Both functions are fully idempotent — the *Granted flags prevent double-crediting.
// Failures are silent — callers must wrap in try/catch.

const User = require('../models/User');
const PromoCode = require('../models/PromoCode');
const Deposit = require('../models/Deposit');
const BonusGrant = require('../models/BonusGrant');

// ── Signup milestone: 25 verified signups → +50 USDT ──
async function checkAndCreditSignupBonus(promoCodeStr) {
  if (!promoCodeStr) return;
  const code = promoCodeStr.toUpperCase();
  const promo = await PromoCode.findOne({ code });
  if (!promo || promo.signupBonusGranted) return;
  if (!promo.ownerUserId) return;

  const count = await User.countDocuments({
    promoCodeUsed: code,
    isEmailVerified: true,
  });
  if (count < promo.signupThreshold) return;

  const owner = await User.findById(promo.ownerUserId);
  if (!owner) return;
  owner.balances.USDT = (owner.balances.USDT || 0) + promo.signupBonusUsd;
  await owner.save();

  promo.signupBonusGranted = true;
  promo.signupBonusGrantedAt = new Date();
  await promo.save();

  await BonusGrant.create({
    userId: owner._id,
    promoCode: code,
    type: 'signup_milestone',
    amountUsd: promo.signupBonusUsd,
    thresholdAt: promo.signupThreshold,
    reachedAt: count,
  });

  console.log(`[promoBonus] signup milestone credited +${promo.signupBonusUsd} USDT to ${owner._id} for code ${code}`);
}

// ── Deposit milestone: 25 distinct depositors → +150 USDT ──
async function checkAndCreditDepositBonus(promoCodeStr) {
  if (!promoCodeStr) return;
  const code = promoCodeStr.toUpperCase();
  const promo = await PromoCode.findOne({ code });
  if (!promo || promo.depositBonusGranted) return;
  if (!promo.ownerUserId) return;

  const referredUserIds = await User.distinct('_id', {
    promoCodeUsed: code,
    isEmailVerified: true,
  });
  if (referredUserIds.length === 0) return;

  const distinctDepositors = await Deposit.distinct('userId', {
    userId: { $in: referredUserIds },
    status: 'approved',
  });
  const count = distinctDepositors.length;
  if (count < promo.depositThreshold) return;

  const owner = await User.findById(promo.ownerUserId);
  if (!owner) return;
  owner.balances.USDT = (owner.balances.USDT || 0) + promo.depositBonusUsd;
  await owner.save();

  promo.depositBonusGranted = true;
  promo.depositBonusGrantedAt = new Date();
  await promo.save();

  await BonusGrant.create({
    userId: owner._id,
    promoCode: code,
    type: 'deposit_milestone',
    amountUsd: promo.depositBonusUsd,
    thresholdAt: promo.depositThreshold,
    reachedAt: count,
  });

  console.log(`[promoBonus] deposit milestone credited +${promo.depositBonusUsd} USDT to ${owner._id} for code ${code}`);
}

module.exports = { checkAndCreditSignupBonus, checkAndCreditDepositBonus };