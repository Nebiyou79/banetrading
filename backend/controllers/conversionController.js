// controllers/conversionController.js
// ── ASSET CONVERSION CONTROLLER ──
// Uses the new market aggregator system exclusively.

const mongoose = require('mongoose');
const User             = require('../models/User');
const Conversion       = require('../models/Conversion');
const ConversionConfig = require('../models/ConversionConfig');

const SLIPPAGE_TOLERANCE = 0.005; // 0.5%

// ── Lazy-load market service ──
let _marketService = null;

function getMarketService() {
  if (!_marketService) {
    try { _marketService = require('../services/market/market.service'); }
    catch { _marketService = null; }
  }
  return _marketService;
}

// ── Get USD price for a currency symbol ──
// Returns price in USD for the given currency.
async function getUsdPrice(currency) {
  if (currency === 'USDT') return 1;

  const marketService = getMarketService();
  if (marketService) {
    try {
      const result = await marketService.getPrice(currency + 'USDT');
      if (result?.price && result.price > 0) return result.price;
    } catch (e) {
      console.warn('[conversionController] getUsdPrice failed for', currency, e.message);
    }
  }

  return null;
}

// ── Compute market rate: how many `to` units per 1 `from` unit ──
async function computeMarketRate(from, to) {
  const [fromPrice, toPrice] = await Promise.all([
    getUsdPrice(from),
    getUsdPrice(to),
  ]);

  if (fromPrice === null || toPrice === null) return null;
  if (toPrice === 0) return null;

  return fromPrice / toPrice;
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

    if (!from || !to || from === to) {
      return res.status(400).json({ message: 'Invalid currency pair' });
    }
    if (!fromAmount || Number(fromAmount) <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const config = await ConversionConfig.findOne() || { feeBps: 100 };
    const marketRate = await computeMarketRate(from, to);

    if (!marketRate) {
      return res.status(503).json({ message: 'Unable to fetch market rate — please try again.' });
    }

    const effectiveRate = marketRate * (1 - config.feeBps / 10000);
    const toAmount      = Number(fromAmount) * effectiveRate;
    const expiresAt     = new Date(Date.now() + 10_000); // 10 seconds

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

    if (!from || !to || from === to) {
      return res.status(400).json({ message: 'Invalid currency pair' });
    }
    if (!fromAmount || Number(fromAmount) <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!quotedRate || Number(quotedRate) <= 0) {
      return res.status(400).json({ message: 'Invalid quoted rate' });
    }

    const user   = req.user;
    const config = await ConversionConfig.findOne() || { feeBps: 100 };

    const available = Number(user.balances[from] || 0);
    if (available < Number(fromAmount)) {
      return res.status(400).json({
        message: `Insufficient ${from} balance. Available: ${available}`,
      });
    }

    // Re-quote fresh market rate
    const freshMarketRate = await computeMarketRate(from, to);
    if (!freshMarketRate) {
      return res.status(503).json({ message: 'Unable to fetch market rate — please retry.' });
    }

    // Slippage check
    const slippage = Math.abs(freshMarketRate - Number(quotedRate)) / Math.abs(Number(quotedRate));
    if (slippage > SLIPPAGE_TOLERANCE) {
      return res.status(400).json({
        message: 'Rate changed significantly, please re-quote.',
        slippage,
      });
    }

    const effectiveRate = freshMarketRate * (1 - config.feeBps / 10000);
    const toAmount      = Number(fromAmount) * effectiveRate;

    // Try to use a Mongoose session for atomicity
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      session = null; // standalone mongod — no-op gracefully
    }

    const u = session
      ? await User.findById(user._id).session(session)
      : await User.findById(user._id);

    if (!u) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    u.balances[from] = (u.balances[from] || 0) - Number(fromAmount);
    u.balances[to]   = (u.balances[to]   || 0) + toAmount;
    u.markModified('balances');
    await u.save({ session });

    const conversion = await Conversion.create(
      [{
        userId:       user._id,
        fromCurrency: from,
        toCurrency:   to,
        fromAmount:   Number(fromAmount),
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
      fromAmount:   Number(fromAmount),
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
    if (typeof feeBps === 'number')        config.feeBps        = feeBps;
    if (typeof minConvertUsd === 'number') config.minConvertUsd = minConvertUsd;
    if (Array.isArray(enabledPairs))       config.enabledPairs  = enabledPairs;
    config.updatedBy = req.user._id;
    await config.save();
    return res.json({ config });
  } catch (err) {
    console.error('[convert] updateConfig:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};