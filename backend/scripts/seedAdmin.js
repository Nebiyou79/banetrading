// scripts/seedAdmin.js
// ── Create a seeded admin user on first boot if none exists ──

const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log(`[seedAdmin] Admin already exists (${existing.email}) — skipping.`);
      return;
    }

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME || 'Platform Admin';

    if (!email || !password) {
      console.warn('[seedAdmin] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin created.');
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: 'admin',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    console.log(`[seedAdmin] Admin seeded: ${admin.email}`);
  } catch (err) {
    console.error('[seedAdmin] Failed:', err);
  }
}

module.exports = seedAdmin;