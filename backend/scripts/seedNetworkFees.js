// scripts/seedNetworkFees.js
// ── Seed default network fees on first boot ──

const NetworkFee = require('../models/NetworkFee');

const DEFAULTS = [
  { network: 'BTC',         fee: 0.0005 },
  { network: 'ETH',         fee: 0.003  },
  { network: 'USDT-ERC20',  fee: 15     },
  { network: 'USDT-TRC20',  fee: 1      },
  { network: 'USDT-BEP20',  fee: 0.8    },
];

async function seedNetworkFees() {
  try {
    const count = await NetworkFee.countDocuments({});
    if (count > 0) {
      console.log(`[seedNetworkFees] ${count} fee(s) already configured — skipping.`);
      return;
    }
    await NetworkFee.insertMany(DEFAULTS);
    console.log(`[seedNetworkFees] Seeded ${DEFAULTS.length} default network fees.`);
  } catch (err) {
    console.error('[seedNetworkFees] Failed:', err);
  }
}

module.exports = seedNetworkFees;