// scripts/migrateBalances.js
// ── IDEMPOTENT MIGRATION: legacy balance → balances.USDT ──

const User = require('../models/User');

async function migrateBalances() {
  const filter = { balance: { $gt: 0 }, 'balances.USDT': 0 };
  const users = await User.find(filter);

  if (users.length === 0) {
    console.log('[migrateBalances] No users to migrate — all good');
    return;
  }

  for (const u of users) {
    u.balances.USDT = (u.balances.USDT || 0) + (u.balance || 0);
    await u.save();
  }

  console.log(`[migrateBalances] Migrated ${users.length} user(s): legacy balance → balances.USDT`);
}

module.exports = migrateBalances;