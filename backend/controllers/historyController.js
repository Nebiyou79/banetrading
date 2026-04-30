// controllers/historyController.js
// ── Unified history controller ──
// Aggregates trades, deposits, withdrawals, and conversions into a single feed.

const Trade = require('../models/Trade');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Conversion = require('../models/Conversion');

const TYPE_MAP = {
  trades:      { model: Trade,       type: 'trade' },
  deposits:    { model: Deposit,     type: 'deposit' },
  withdrawals: { model: Withdrawal,  type: 'withdrawal' },
  conversions: { model: Conversion,  type: 'conversion' },
};

const VALID_TYPES = ['trades', 'deposits', 'withdrawals', 'conversions', 'all'];

// ── GET /api/history ──
async function getHistory(req, res) {
  try {
    const userId = req.user._id;
    const type = VALID_TYPES.includes(req.query.type) ? req.query.type : 'all';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const status = ['pending', 'approved', 'rejected', 'completed', 'failed'].includes(req.query.status)
      ? req.query.status
      : null;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    // ── Build base filter ──
    const buildFilter = () => {
      const filter = { userId };
      if (status) filter.status = status;
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = from;
        if (to) filter.createdAt.$lte = to;
      }
      return filter;
    };

    if (type === 'all') {
      // ── Fetch all 4 collections in parallel ──
      const filter = buildFilter();
      const [trades, deposits, withdrawals, conversions] = await Promise.all([
        Trade.find(filter).sort({ createdAt: -1 }).lean(),
        Deposit.find(filter).sort({ createdAt: -1 }).lean(),
        Withdrawal.find(filter).sort({ createdAt: -1 }).lean(),
        Conversion.find(filter).sort({ createdAt: -1 }).lean(),
      ]);

      // ── Normalize each record ──
      const items = [
        ...trades.map(normalizeTrade),
        ...deposits.map(normalizeDeposit),
        ...withdrawals.map(normalizeWithdrawal),
        ...conversions.map(normalizeConversion),
      ];

      // ── Sort merged by createdAt DESC ──
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = items.length;
      const paginated = items.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      return res.json({ items: paginated, total, hasMore });
    }

    // ── Single type ──
    const config = TYPE_MAP[type];
    if (!config) return res.status(400).json({ message: 'Invalid type' });

    const filter = buildFilter();
    const [items, total] = await Promise.all([
      config.model.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      config.model.countDocuments(filter),
    ]);

    const normalized = items.map(item => {
      switch (type) {
        case 'trades':      return normalizeTrade(item);
        case 'deposits':    return normalizeDeposit(item);
        case 'withdrawals': return normalizeWithdrawal(item);
        case 'conversions': return normalizeConversion(item);
        default:            return null;
      }
    }).filter(Boolean);

    const hasMore = offset + limit < total;
    return res.json({ items: normalized, total, hasMore });
  } catch (err) {
    console.error('[history] getHistory error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── Normalizers ──
function normalizeTrade(t) {
  return {
    id: t._id.toString(),
    type: 'trade',
    createdAt: t.createdAt,
    status: t.status || 'completed',
    pair: t.pair || t.symbol || '',
    amount: t.amount || 0,
    plan: t.plan || '',
    duration: t.duration || 0,
    result: t.result || t.pnl || 0,
  };
}

function normalizeDeposit(d) {
  return {
    id: d._id.toString(),
    type: 'deposit',
    createdAt: d.createdAt,
    status: d.status,
    currency: d.currency || '',
    network: d.network || '',
    amount: d.amount || 0,
  };
}

function normalizeWithdrawal(w) {
  return {
    id: w._id.toString(),
    type: 'withdrawal',
    createdAt: w.createdAt,
    status: w.status,
    currency: w.currency || '',
    network: w.network || '',
    amount: w.amount || 0,
    address: w.toAddress || '',
  };
}

function normalizeConversion(c) {
  return {
    id: c._id.toString(),
    type: 'conversion',
    createdAt: c.createdAt,
    status: c.status || 'completed',
    fromCurrency: c.fromCurrency || '',
    toCurrency: c.toCurrency || '',
    fromAmount: c.fromAmount || 0,
    toAmount: c.toAmount || 0,
    rate: c.rate || 0,
  };
}

module.exports = { getHistory };