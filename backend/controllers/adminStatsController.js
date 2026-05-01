// controllers/adminStatsController.js
// ── Admin dashboard statistics controller ──

const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const Trade = require('../models/Trade');
const SupportTicket = require('../models/SupportTicket');

// ── GET /api/admin/stats ──
async function getStats(req, res) {
  try {
    const [
      totalUsers,
      totalDeposits,
      pendingDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      totalTrades,
      openTickets,
    ] = await Promise.all([
      User.countDocuments(),
      Deposit.countDocuments(),
      Deposit.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments(),
      Withdrawal.countDocuments({ status: 'pending' }),
      Trade.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    ]);

    return res.status(200).json({
      totalUsers,
      totalDeposits,
      pendingDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      totalTrades,
      openTickets,
    });
  } catch (err) {
    console.error('[adminStats] getStats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getStats };