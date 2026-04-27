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

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
// ── Static uploads (cross-origin images) ──
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET'],
}), express.static(process.env.UPLOAD_DIR || './uploads'));
app.use('/api', apiLimiter);

// ── Routes ──
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/user',   require('./routes/user'));
app.use('/api/promo',  require('./routes/promo'));

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
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
}).catch((e) => { console.error('DB connect failed:', e); process.exit(1); });