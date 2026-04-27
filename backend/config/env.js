// config/env.js
// ── Fail-fast env validation ──

const REQUIRED = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_RESET_SECRET',
];

function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('[env] Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[env] SMTP not fully configured — OTP emails will fail until set.');
  }
  if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
    console.warn('[env] SEED_ADMIN_* vars missing — admin seed will be skipped.');
  }
}

module.exports = { validateEnv };