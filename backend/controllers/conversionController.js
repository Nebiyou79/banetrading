// controllers/conversionController.js
// ── ASSET CONVERSION CONTROLLER ──
// Updated to use new market aggregator system

const mongoose = require('mongoose');
const User             = require('../models/User');
const Conversion       = require('../models/Conversion');
const ConversionConfig = require('../models/ConversionConfig');

const SLIPPAGE_TOLERANCE = 0.005;

// ── Lazy-load aggregators ──
let _priceAggregator = null;
let _forexAggregator = null;
let _marketService = null;

function getPriceAggregator() {
  if (!_priceAggregator) {
    try { _priceAggregator = require('../services/market/market.aggregator'); } catch { _priceAggregator = null; }
  }
  return _priceAggregator;
}

function getForexAggregator() {
  if (!_forexAggregator) {
    try { _forexAggregator = require('../services/forexAggregator'); } catch { _forexAggregator = null; }
  }
  return _forexAggregator;
}

function getMarketService() {
  if (!_marketService) {
    try { _marketService = require('../src/services/market/market.service'); } catch { _marketService = null; }
  }
  return _marketService;
}

// ── Helpers ──

function getPrice(rows, symbol) {
  const row = rows.find((r) => r.symbol === symbol);
  return row?.price ?? null;
}

async function getCurrentPrices() {
  const priceAgg = getPriceAggregator();
  const forexAgg = getForexAggregator();

  const [crypto, fx] = await Promise.all([
    priceAgg ? priceAgg.getMarketList().catch(() => null) : Promise.resolve(null),
    forexAgg ? forexAgg.getForexAndMetals().catch(() => null) : Promise.resolve(null),
  ]);

  return {
    cryptoRows: crypto?.rows || [],
    fxRows:     fx?.rows    || [],
  };
}

async function getPriceFromService(symbol) {
  // Try new market service first
  const marketService = getMarketService();
  if (marketService) {
    try {
      const result = await marketService.getPrice(symbol);
      if (result?.price) return result.price;
    } catch {}
  }

  // Fall back to old aggregators
  const { cryptoRows } = await getCurrentPrices();
  return getPrice(cryptoRows, symbol);
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
    const config = await ConversionConfig.findOne() || { feeBps: 100 };

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

    const available = Number(user.balances[from] || 0);
    if (available < fromAmount) {
      return res.status(400).json({
        message: `Insufficient ${from} balance. Available: ${available}`,
      });
    }

    const { cryptoRows } = await getCurrentPrices();
    const freshMarketRate = computeMarketRate(from, to, cryptoRows);
    if (!freshMarketRate) {
      return res.status(503).json({ message: 'Unable to fetch market rate — please retry.' });
    }

    const slippage = Math.abs(freshMarketRate - quotedRate) / Math.abs(quotedRate);
    if (slippage > SLIPPAGE_TOLERANCE) {
      return res.status(400).json({
        message: 'Rate changed significantly, please re-quote.',
        slippage,
      });
    }

    const effectiveRate = freshMarketRate * (1 - config.feeBps / 10000);
    const toAmount      = fromAmount * effectiveRate;

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

    u.balances[from] = (u.balances[from] || 0) - fromAmount;
    u.balances[to]   = (u.balances[to]   || 0) + toAmount;
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
      try { await session.abortTransaction(); } catch {}
    }
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (session) {
      try { await session.endSession(); } catch {}
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