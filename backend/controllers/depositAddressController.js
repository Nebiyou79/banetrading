// controllers/depositAddressController.js
// ── Deposit address book controller ──

const DepositAddresses = require('../models/DepositAddresses');

const VALID_KEYS = ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'];

function emptyMap() {
  return {
    'USDT-ERC20': '',
    'USDT-TRC20': '',
    'USDT-BEP20': '',
    BTC:          '',
    ETH:          '',
  };
}

// ── GET /api/deposit-addresses ──
async function getDepositAddresses(_req, res) {
  try {
    const doc = await DepositAddresses.findOne({}).sort({ createdAt: 1 }).lean();
    const addresses = { ...emptyMap(), ...((doc && doc.addresses) || {}) };
    return res.status(200).json({
      addresses,
      updatedAt: doc?.updatedAt || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ── PUT /api/deposit-addresses ── (admin)
async function updateDepositAddresses(req, res) {
  try {
    const incoming = req.body || {};
    const patch = {};
    for (const k of VALID_KEYS) {
      if (Object.prototype.hasOwnProperty.call(incoming, k)) {
        const v = incoming[k];
        // Empty string clears that entry; any provided string is trimmed and stored.
        patch[k] = typeof v === 'string' ? v.trim() : '';
      }
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'No addresses provided' });
    }

    let doc = await DepositAddresses.findOne({}).sort({ createdAt: 1 });
    if (!doc) {
      doc = await DepositAddresses.create({
        addresses: { ...emptyMap(), ...patch },
        updatedBy: req.user._id,
      });
    } else {
      const merged = { ...emptyMap(), ...(doc.addresses || {}), ...patch };
      doc.addresses = merged;
      doc.updatedBy = req.user._id;
      await doc.save();
    }

    return res.status(200).json({
      message: 'Deposit addresses updated',
      addresses: { ...emptyMap(), ...(doc.addresses || {}) },
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getDepositAddresses,
  updateDepositAddresses,
};