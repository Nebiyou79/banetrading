// controllers/tradeController.js
// ── TRADING CONTROLLER (Module 7) ──
// Updated to use new market aggregator system

const Trade = require('../models/Trade');
const TradingConfig = require('../models/TradingConfig');
const User = require('../models/User');
const { TIER_1, BY_BINANCE } = require('../config/coins');
const { FOREX_PAIRS, FX_BY_SYMBOL } = require('../config/forex');
const { METAL_PAIRS, METAL_BY_SYMBOL } = require('../config/metals');
const tradeResolver = require('../services/tradeResolver');

const TRADING_ASSETS = ['USDT'];

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

async function getOrCreateConfig() {
  let config = await TradingConfig.findOne();
  if (!config) {
    config = await TradingConfig.create({
      plans: [
        { key: 'SILVER',   multiplier: 0.12, durationSec: 30,  minUsd: 50,     active: true },
        { key: 'GOLD',     multiplier: 0.18, durationSec: 60,  minUsd: 10000,  active: true },
        { key: 'PLATINUM', multiplier: 0.25, durationSec: 90,  minUsd: 40000,  active: true },
        { key: 'DIAMOND',  multiplier: 0.32, durationSec: 120, minUsd: 90000,  active: true },
        { key: 'ELITE',    multiplier: 0.45, durationSec: 150, minUsd: 130000, active: true },
      ],
      feeBps: 200,
      enabledPairs: [],
    });
  }
  return config;
}

async function fetchPairPrice(pair, pairClass) {
  // Try new market service first
  const marketService = getMarketService();
  if (marketService) {
    try {
      const result = await marketService.getPrice(pair);
      if (result?.price) return result.price;
    } catch {}
  }

  // Fall back to old aggregators
  if (pairClass === 'crypto') {
    const priceAgg = getPriceAggregator();
    if (!priceAgg) return null;
    const meta = BY_BINANCE[pair];
    if (!meta) return null;
    const { rows } = await priceAgg.getMarketList();
    const row = rows.find((r) => r.symbol === meta.symbol);
    return row?.price ?? null;
  }

  if (pairClass === 'forex' || pairClass === 'metals') {
    const forexAgg = getForexAggregator();
    if (!forexAgg) return null;
    const { rows } = await forexAgg.getForexAndMetals();
    const row = rows.find((r) => r.symbol === pair);
    return row?.price ?? null;
  }

  return null;
}

function resolvePair(pair) {
  if (BY_BINANCE[pair]) {
    const meta = BY_BINANCE[pair];
    return { class: 'crypto', symbol: pair, display: `${meta.symbol}/USDT`, base: meta.symbol };
  }
  if (FX_BY_SYMBOL[pair]) {
    const meta = FX_BY_SYMBOL[pair];
    return { class: 'forex', symbol: pair, display: meta.display, base: meta.base };
  }
  if (METAL_BY_SYMBOL[pair]) {
    const meta = METAL_BY_SYMBOL[pair];
    return { class: 'metals', symbol: pair, display: meta.display, base: meta.base };
  }
  return null;
}

// ── GET /api/trade/config ──
exports.getConfig = async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.json({
      plans: config.plans.filter((p) => p.active),
      feeBps: config.feeBps,
      enabledPairs: config.enabledPairs,
      tradingAssets: TRADING_ASSETS,
    });
  } catch (err) {
    console.error('[trade] getConfig error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/trade/pairs ──
exports.getPairs = async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    const enabled = (config.enabledPairs || []).map((s) => s.toUpperCase());
    const isEnabled = (sym) => enabled.length === 0 || enabled.includes(sym.toUpperCase());

    const crypto = TIER_1
      .filter((c) => c.binanceSymbol && isEnabled(c.binanceSymbol))
      .map((c) => ({
        symbol: c.binanceSymbol, display: `${c.symbol}/USDT`, base: c.symbol, quote: 'USDT', name: c.name, color: c.color,
      }));

    const forex = FOREX_PAIRS
      .filter((p) => isEnabled(p.symbol))
      .map((p) => ({ symbol: p.symbol, display: p.display, base: p.base, quote: p.quote, name: p.name, color: p.color }));

    const metals = METAL_PAIRS
      .filter((p) => isEnabled(p.symbol))
      .map((p) => ({ symbol: p.symbol, display: p.display, base: p.base, quote: p.quote, name: p.name, color: p.color }));

    return res.json({ crypto, forex, metals });
  } catch (err) {
    console.error('[trade] getPairs error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── POST /api/trade/place ──
exports.placeTrade = async (req, res) => {
  try {
    const { pair, direction, planKey, tradingAsset, stake } = req.body;
    const user = req.user;

    const pairMeta = resolvePair(pair);
    if (!pairMeta) return res.status(400).json({ message: 'Unknown trading pair' });

    if (!TRADING_ASSETS.includes(tradingAsset)) {
      return res.status(400).json({
        message: `Only USDT is accepted. Please convert ${tradingAsset} to USDT first.`,
        allowedAssets: TRADING_ASSETS,
      });
    }

    if (direction !== 'buy' && direction !== 'sell') {
      return res.status(400).json({ message: 'Invalid direction' });
    }

    const stakeNum = Number(stake);
    if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
      return res.status(400).json({ message: 'Invalid stake amount' });
    }

    const config = await getOrCreateConfig();
    const plan = config.plans.find((p) => p.key === planKey && p.active);
    if (!plan) return res.status(400).json({ message: 'Selected plan is unavailable' });

    const enabled = (config.enabledPairs || []).map((s) => s.toUpperCase());
    if (enabled.length > 0 && !enabled.includes(pair.toUpperCase())) {
      return res.status(400).json({ message: 'This pair is not currently tradeable' });
    }

    if (stakeNum < plan.minUsd) {
      return res.status(400).json({
        message: `Below minimum: ${plan.minUsd} USDT required for ${plan.key} plan`,
        minInAsset: plan.minUsd,
      });
    }

    const available = user.balances?.USDT || 0;
    if (available < stakeNum) {
      return res.status(400).json({
        message: `Insufficient USDT balance. Available: ${available.toFixed(2)} USDT`,
      });
    }

    const entryPrice = await fetchPairPrice(pair, pairMeta.class);
    if (entryPrice === null || entryPrice <= 0) {
      return res.status(503).json({ message: 'Entry price unavailable — please retry.' });
    }

    user.balances.USDT = available - stakeNum;
    user.markModified('balances');
    await user.save();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.durationSec * 1000);
    const trade = await Trade.create({
      userId: user._id, pair, pairClass: pairMeta.class, pairDisplay: pairMeta.display,
      direction, tradingAsset: 'USDT', stake: stakeNum,
      planKey: plan.key, planMultiplier: plan.multiplier, planDurationSec: plan.durationSec,
      feeBps: config.feeBps, entryPrice, expiresAt, resolveAt: expiresAt, status: 'pending',
    });

    tradeResolver.scheduleResolution(trade);
    return res.status(201).json({ trade });
  } catch (err) {
    console.error('[trade] placeTrade error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/trade/active ──
exports.getActive = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id, status: 'pending' }).sort({ createdAt: -1 }).lean();
    return res.json({ trades });
  } catch (err) {
    console.error('[trade] getActive error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/trade/history ──
exports.getHistory = async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const filter = { userId: req.user._id, status: { $ne: 'pending' } };
    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Trade.countDocuments(filter),
    ]);
    return res.json({ trades, total, limit, offset });
  } catch (err) {
    console.error('[trade] getHistory error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/trade/:id ──
exports.getOne = async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    return res.json({ trade });
  } catch (err) {
    console.error('[trade] getOne error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/trade/admin/all ──
exports.adminListAll = async (req, res) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const filter = {};
    if (req.query.userId)  filter.userId = req.query.userId;
    if (req.query.status && ['pending','won','lost','cancelled'].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.planKey && ['SILVER','GOLD','PLATINUM','DIAMOND','ELITE'].includes(req.query.planKey)) filter.planKey = req.query.planKey;
    const [trades, total] = await Promise.all([
      Trade.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).populate('userId', 'name email').lean(),
      Trade.countDocuments(filter),
    ]);
    return res.json({ trades, total, limit, offset });
  } catch (err) {
    console.error('[trade] adminListAll error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/trade/admin/config ──
exports.adminUpdateConfig = async (req, res) => {
  try {
    const { plans, feeBps, enabledPairs } = req.body;
    const config = await getOrCreateConfig();
    if (Array.isArray(plans)) {
      for (const p of plans) {
        if (!p || !['SILVER','GOLD','PLATINUM','DIAMOND','ELITE'].includes(p.key) || typeof p.multiplier !== 'number' || p.multiplier < 0 || typeof p.durationSec !== 'number' || p.durationSec < 1 || typeof p.minUsd !== 'number' || p.minUsd < 0) {
          return res.status(400).json({ message: `Invalid plan entry: ${p?.key || 'unknown'}` });
        }
      }
      config.plans = plans.map((p) => ({ key: p.key, multiplier: p.multiplier, durationSec: p.durationSec, minUsd: p.minUsd, active: p.active !== false }));
    }
    if (typeof feeBps === 'number' && feeBps >= 0 && feeBps <= 5000) config.feeBps = feeBps;
    if (Array.isArray(enabledPairs)) config.enabledPairs = enabledPairs.map((s) => String(s).toUpperCase());
    config.updatedBy = req.user._id;
    await config.save();
    return res.json({ config });
  } catch (err) {
    console.error('[trade] adminUpdateConfig error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── PUT /api/trade/admin/automode/:userId ──
exports.adminSetAutoMode = async (req, res) => {
  try {
    const VALID = ['off', 'random', 'alwaysWin', 'alwaysLose'];
    const { mode } = req.body;
    if (!VALID.includes(mode)) return res.status(400).json({ message: 'Invalid mode' });
    const u = await User.findById(req.params.userId);
    if (!u) return res.status(404).json({ message: 'User not found' });
    u.autoMode = mode;
    await u.save();
    return res.json({ userId: u._id, autoMode: u.autoMode });
  } catch (err) {
    console.error('[trade] adminSetAutoMode error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ── GET /api/trade/admin/automode/:userId ──
exports.adminGetAutoMode = async (req, res) => {
  try {
    const u = await User.findById(req.params.userId).lean();
    if (!u) return res.status(404).json({ message: 'User not found' });
    return res.json({ userId: u._id, autoMode: u.autoMode || 'random' });
  } catch (err) {
    console.error('[trade] adminGetAutoMode error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};