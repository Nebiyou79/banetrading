// controllers/conversionController.js
// ── ASSET CONVERSION CONTROLLER ──
//
// BALANCE FIX:
// 1. Added u.markModified('balances') before every u.save() that mutates balances.
//    Without this Mongoose silently skips nested-object changes.
// 2. Balance availability check uses user.balances[from] only (available, not locked).
// 3. No lockedBalances involved in conversions — they are instant atomic swaps.

const mongoose = require('mongoose');
const User             = require('../models/User');
const Conversion       = require('../models/Conversion');
const ConversionConfig = require('../models/ConversionConfig');
const { getMarketList }      = require('../services/priceAggregator');
const { getForexAndMetals }  = require('../services/forexAggregator');

const SLIPPAGE_TOLERANCE = 0.005; // 0.5%

// ── Helpers ──

function getPrice(rows, symbol) {
  const row = rows.find((r) => r.symbol === symbol);
  return row?.price ?? null;
}

async function getCurrentPrices() {
  const [crypto, fx] = await Promise.all([
    getMarketList().catch(() => null),
    getForexAndMetals().catch(() => null),
  ]);
  return {
    cryptoRows: crypto?.rows || [],
    fxRows:     fx?.rows    || [],
  };
}

function computeMarketRate(from, to, rows) {
  if (from === 'USDT') {
    const p = getPrice(rows, to);
    return p ? 1 / p : null;
  }
  if (to === 'USDT') {
    return getPrice(rows, from);
  }
  const pFrom = getPrice(rows, from);
  const pTo   = getPrice(rows, to);
  if (!pFrom || !pTo) return null;
  return pFrom / pTo;
}

// ── GET /api/convert/balances ──
exports.getBalances = async (req, res) => {
  try {
    return res.json({ balances: req.user.balances });
  } catch (err) {
    console.error('[convert] getBalances:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/convert/quote ──
exports.quote = async (req, res) => {
  try {
    const { from, to, fromAmount } = req.body;

    if (from === to) {
      return res.status(400).json({ message: 'Cannot convert same currency' });
    }

    const { cryptoRows } = await getCurrentPrices();
    const config         = await ConversionConfig.findOne() || { feeBps: 100 };

    const marketRate = computeMarketRate(from, to, cryptoRows);
    if (!marketRate) {
      return res.status(503).json({ message: 'Unable to fetch market rate — please try again.' });
    }

    const effectiveRate = marketRate * (1 - config.feeBps / 10000);
    const toAmount      = fromAmount * effectiveRate;
    const expiresAt     = new Date(Date.now() + 10 * 1000);

    return res.json({
      marketRate,
      effectiveRate,
      toAmount,
      feeBps:    config.feeBps,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[convert] quote:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/convert/execute ──
exports.execute = async (req, res) => {
  let session = null;
  try {
    const { from, to, fromAmount, quotedRate } = req.body;

    if (from === to) {
      return res.status(400).json({ message: 'Cannot convert same currency' });
    }

    const user   = req.user;
    const config = await ConversionConfig.findOne() || { feeBps: 100 };

    // ── Check available balance only (not locked) ──
    const available = Number(user.balances[from] || 0);
    if (available < fromAmount) {
      return res.status(400).json({
        message: `Insufficient ${from} balance. Available: ${available}`,
      });
    }

    // ── Re-quote for fresh market rate ──
    const { cryptoRows } = await getCurrentPrices();
    const freshMarketRate = computeMarketRate(from, to, cryptoRows);
    if (!freshMarketRate) {
      return res.status(503).json({ message: 'Unable to fetch market rate — please retry.' });
    }

    // ── Slippage check (0.5% tolerance) ──
    const slippage = Math.abs(freshMarketRate - quotedRate) / Math.abs(quotedRate);
    if (slippage > SLIPPAGE_TOLERANCE) {
      return res.status(400).json({
        message: 'Rate changed significantly, please re-quote.',
        slippage,
      });
    }

    const effectiveRate = freshMarketRate * (1 - config.feeBps / 10000);
    const toAmount      = fromAmount * effectiveRate;

    // ── Atomic debit/credit ──
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }

    const u = session
      ? await User.findById(user._id).session(session)
      : await User.findById(user._id);

    if (!u) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Debit source currency, credit target currency
    u.balances[from] = (u.balances[from] || 0) - fromAmount;
    u.balances[to]   = (u.balances[to]   || 0) + toAmount;

    // CRITICAL: markModified so Mongoose detects the nested object mutation
    u.markModified('balances');
    await u.save({ session });

    const conversion = await Conversion.create(
      [{
        userId:       user._id,
        fromCurrency: from,
        toCurrency:   to,
        fromAmount,
        toAmount,
        rate:         effectiveRate,
        marketRate:   freshMarketRate,
        feeBps:       config.feeBps,
        status:       'completed',
      }],
      { session },
    );

    if (session) await session.commitTransaction();

    return res.json({
      rate:         effectiveRate,
      fromAmount,
      toAmount,
      conversionId: conversion[0]._id.toString(),
    });
  } catch (err) {
    console.error('[convert] execute:', err);
    if (session) {
      try { await session.abortTransaction(); } catch { /* ignore */ }
    }
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (session) {
      try { await session.endSession(); } catch { /* ignore */ }
    }
  }
};

// ── GET /api/convert/history ──
exports.history = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const conversions = await Conversion.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json({ conversions });
  } catch (err) {
    console.error('[convert] history:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/convert/admin/config ──
exports.getConfig = async (req, res) => {
  try {
    let config = await ConversionConfig.findOne();
    if (!config) {
      config = await ConversionConfig.create({ feeBps: 100, minConvertUsd: 1 });
    }
    return res.json({ config });
  } catch (err) {
    console.error('[convert] getConfig:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/convert/admin/config ──
exports.updateConfig = async (req, res) => {
  try {
    const { feeBps, minConvertUsd, enabledPairs } = req.body;
    let config = await ConversionConfig.findOne();
    if (!config) config = new ConversionConfig();
    if (typeof feeBps === 'number')       config.feeBps        = feeBps;
    if (typeof minConvertUsd === 'number') config.minConvertUsd = minConvertUsd;
    if (Array.isArray(enabledPairs))      config.enabledPairs  = enabledPairs;
    config.updatedBy = req.user._id;
    await config.save();
    return res.json({ config });
  } catch (err) {
    console.error('[convert] updateConfig:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};