// controllers/networkFeeController.js
// ── Network fee controller ──

const NetworkFee = require('../models/NetworkFee');
const { ALL_WITHDRAW_NETWORKS } = require('../utils/coinNetwork');

// ── GET /api/fees ──
async function getAllFees(_req, res) {
  try {
    const docs = await NetworkFee.find({}).sort({ network: 1 }).lean();
    const map = {};
    for (const n of ALL_WITHDRAW_NETWORKS) map[n] = null;
    for (const d of docs) map[d.network] = Number(d.fee);
    return res.status(200).json({ fees: map });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── PUT /api/fees/:network ── (admin)
async function updateFee(req, res) {
  try {
    const network = req.params.network;
    if (!ALL_WITHDRAW_NETWORKS.includes(network)) {
      return res.status(400).json({ message: 'Invalid network' });
    }
    const fee = Number(req.body?.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ message: 'Fee must be a non-negative number' });
    }

    const doc = await NetworkFee.findOneAndUpdate(
      { network },
      { network, fee, updatedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({
      message: 'Fee updated',
      network: doc.network,
      fee: Number(doc.fee),
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getAllFees,
  updateFee,
};