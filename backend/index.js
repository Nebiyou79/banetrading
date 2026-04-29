// index.js
// ── Backend entry ──

require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const { apiLimiter } = require('./middleware/rareLimiter');
const seedAdmin = require('./scripts/seedAdmin');
const seedNetworkFees = require('./scripts/seedNetworkFees');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

app.use('/api', apiLimiter);

// ── Routes ──
app.use('/api/auth',              require('./routes/auth'));
app.use('/api/user',              require('./routes/user'));
app.use('/api/promo',             require('./routes/promo'));
app.use('/api/funds',             require('./routes/funds'));
app.use('/api/deposit-addresses', require('./routes/depositAddresses'));
app.use('/api/fees',              require('./routes/fees'));
app.use('/api/kyc',               require('./routes/kyc'));
app.use('/api/admin',             require('./routes/admin'));

// ── Markets routes (primary + backward-compatible mount) ──
const pricesRouter = require('./routes/prices');
app.use('/api/markets', pricesRouter);

// Backward-compatible mount: if /api/prices was used before,
// serve the same router at both paths.
app.use('/api/prices', pricesRouter);

// Module 6 additions ────────────────────────────────────────────────
app.use('/api/convert', require('./routes/convert'));
// ───────────────────────────────────────────────────────────────────

// ── Health ──
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Error handler ──
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('[db] MongoDB connected');
  await seedAdmin();
  await seedNetworkFees();

  // Module 6 additions ──────────────────────────────────────────────
  await require('./scripts/seedConversionConfig')();
  await require('./scripts/migrateBalances')();
  // ─────────────────────────────────────────────────────────────────

  app.listen(PORT, () => console.log(`API running on :${PORT}`));
}).catch((e) => { console.error('DB connect failed:', e); process.exit(1); });