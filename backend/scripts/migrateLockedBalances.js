// scripts/migrateLockedBalances.js
// ── One-time migration: add lockedBalances map to all existing users ──
//
// BALANCE FIX migration:
// The User schema now has a `lockedBalances` map alongside `balances`.
// Existing documents in MongoDB won't have this field. This script adds it
// with all-zero defaults for every user that lacks it.
//
// Run once at startup (called from index.js) or manually:
//   node scripts/migrateLockedBalances.js
//
// Safe to run multiple times — uses $exists: false guard to skip already-migrated docs.

const mongoose = require('mongoose');

const ZERO_LOCKED = {
  USDT: 0,
  BTC:  0,
  ETH:  0,
  SOL:  0,
  BNB:  0,
  XRP:  0,
};

async function migrateLockedBalances() {
  try {
    const User = require('../models/User');

    // Find all users missing the lockedBalances field
    const result = await User.updateMany(
      { lockedBalances: { $exists: false } },
      { $set: { lockedBalances: ZERO_LOCKED } },
    );

    if (result.modifiedCount > 0) {
      console.log(`[migrateLockedBalances] Added lockedBalances to ${result.modifiedCount} user(s).`);
    } else {
      console.log('[migrateLockedBalances] All users already have lockedBalances — skipping.');
    }
  } catch (err) {
    // Non-fatal: log and continue startup
    console.error('[migrateLockedBalances] Migration failed (non-fatal):', err.message);
  }
}

module.exports = migrateLockedBalances;