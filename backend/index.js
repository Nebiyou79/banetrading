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
app.use('/api/prices',  pricesRouter);

// Module 6 additions ────────────────────────────────────────────────
app.use('/api/convert', require('./routes/convert'));

// Module 7 additions ────────────────────────────────────────────────
app.use('/api/trade', require('./routes/trade'));

// Module 8 additions ────────────────────────────────────────────────
app.use('/api/history', require('./routes/history'));
app.use('/api/support', require('./routes/support'));

// ── NEW Market Data System ────────────────────────────────────────
// Mount new market routes (with fallback)
try {
  app.use('/api/market', require('./routes/market.routes'));
  console.log('[Market] New market routes mounted at /api/market');
} catch (err) {
  console.warn('[Market] New routes unavailable, using fallback:', err.message);
}

// Universal chart endpoint (TradingView compatibility)
// Uses new market.service for crypto/forex/metals with synthetic fallback
app.get('/api/chart', async (req, res) => {
  try {
    const symbol = req.query.symbol;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing symbol parameter',
      });
    }

    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit) || 300, 1000);

    let candles = [];
    let source = 'synthetic';

    // Try new market service first
    try {
      const marketService = require('./src/services/market/market.service');
      candles = await marketService.getCandles(symbol, interval, limit);
      source = 'market-service';
    } catch (err) {
      // Fall back to old ohlcProvider
      try {
        const ohlcProvider = require('./services/ohlcProvider');
        const result = await ohlcProvider.getOhlc(symbol, interval, limit);
        if (result?.candles?.length > 0) {
          candles = result.candles;
          source = result.source || 'ohlc-provider';
        }
      } catch (err2) {
        console.warn(`[Chart] All providers failed for ${symbol}/${interval}, using synthetic`);
      }
    }

    // Validate candles — filter out invalid data
    const validCandles = (Array.isArray(candles) ? candles : []).filter(c => {
      if (!c || typeof c !== 'object') return false;
      const open = Number(c.open);
      const high = Number(c.high);
      const low = Number(c.low);
      const close = Number(c.close);
      if (!c.time || c.time <= 0) return false;
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) return false;
      if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return false;
      if (low > high) return false;
      return true;
    }).map(c => ({
      time: Number(c.time),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume || 0),
    }));

    res.json({
      success: true,
      data: validCandles,
      symbol: symbol,
      interval,
      source,
      count: validCandles.length,
    });
  } catch (error) {
    console.error('[Chart] Error:', error.message);
    res.json({
      success: true,
      data: [],
      symbol: req.query.symbol || '',
      interval: req.query.interval || '1h',
      count: 0,
    });
  }
});

// Health check with provider status
app.get('/api/market/health', async (_req, res) => {
  try {
    const marketService = require('./src/services/market/market.service');
    const health = await marketService.getHealth();
    res.json({ success: true, data: health });
  } catch {
    res.json({ success: true, data: [], message: 'Market service not available' });
  }
});
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
  try { await require('./scripts/seedConversionConfig')(); } catch (e) { console.warn('[Seed] ConversionConfig skipped:', e.message); }
  try { await require('./scripts/migrateBalances')(); } catch (e) { console.warn('[Migrate] Balances skipped:', e.message); }

  // BALANCE FIX ─────────────────────────────────────────────────────
  try { await require('./scripts/migrateLockedBalances')(); } catch (e) { console.warn('[Migrate] LockedBalances skipped:', e.message); }

  // Module 7 additions ──────────────────────────────────────────────
  try { await require('./scripts/seedTradingConfig')(); } catch (e) { console.warn('[Seed] TradingConfig skipped:', e.message); }
  try { await require('./services/tradeResolver').resumePendingOnBoot(); } catch (e) { console.warn('[TradeResolver] Boot recovery skipped:', e.message); }

  // Module 8 additions ──────────────────────────────────────────────
  try { await require('./scripts/seedSupportConfig')(); } catch (e) { console.warn('[Seed] SupportConfig skipped:', e.message); }

  // ── Start HTTP server ────────────────────────────────────────────
  const server = app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
    console.log('[System] Using new market aggregator (market.aggregator.js + market.service.js)');
    console.log('[System] Using forex/metals aggregator (forexAggregator.js)');
    console.log('[System] Synthetic fallback active for unavailable providers');
  });

  // Initialize WebSocket broadcaster (optional)
  try {
    const { initClientBroadcaster } = require('./src/services/market/websocket/client.broadcaster');
    initClientBroadcaster(server);
    console.log('[WS] Market WebSocket initialized on /ws/market');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('[WS] WebSocket not configured — REST-only mode');
    } else {
      console.warn('[WS] Initialization skipped:', err.message);
    }
  }

}).catch((e) => { console.error('DB connect failed:', e); process.exit(1); });