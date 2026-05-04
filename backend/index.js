// index.js
// ── Backend entry — NEW market system ──

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

// ── Core routes ──
app.use('/api/auth',              require('./routes/auth'));
app.use('/api/user',              require('./routes/user'));
app.use('/api/promo',             require('./routes/promo'));
app.use('/api/funds',             require('./routes/funds'));
app.use('/api/deposit-addresses', require('./routes/depositAddresses'));
app.use('/api/fees',              require('./routes/fees'));
app.use('/api/kyc',               require('./routes/kyc'));
app.use('/api/admin',             require('./routes/admin'));

// ── Markets routes (new unified router at both legacy and new paths) ──
const pricesRouter = require('./routes/prices');
app.use('/api/markets', pricesRouter);
app.use('/api/prices',  pricesRouter); // backward compat

// ── New market controller routes (for /api/market/* paths) ──
try {
  app.use('/api/market', require('./routes/market.routes'));
  console.log('[Market] New market routes mounted at /api/market');
} catch (err) {
  console.warn('[Market] New routes unavailable, using legacy fallback:', err.message);
}

// ── Convert / Trade / History / Support ──
app.use('/api/convert', require('./routes/convert'));
app.use('/api/trade',   require('./routes/trade'));
app.use('/api/history', require('./routes/history'));
app.use('/api/support', require('./routes/support'));

// ── Universal chart endpoint (TradingView-compatible) ──
app.get('/api/chart', async (req, res) => {
  try {
    const symbol = (req.query.symbol || '').toUpperCase();
    if (!symbol) return res.status(400).json({ success: false, error: 'Missing symbol' });

    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit, 10) || 300, 1000);

    let candles = [];
    let source = 'synthetic';

    try {
      const marketService = require('./services/market/market.service');
      candles = await marketService.getCandles(symbol, interval, limit);
      source = 'market-service';
    } catch (err) {
      console.warn(`[Chart] market.service failed for ${symbol}/${interval}: ${err.message}`);
    }

    const valid = (Array.isArray(candles) ? candles : []).filter(c => {
      if (!c || !c.time || c.time <= 0) return false;
      const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close);
      return !isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(cl) && o > 0 && h > 0 && l > 0 && cl > 0 && l <= h;
    }).map(c => ({
      time:   Number(c.time),
      open:   Number(c.open),
      high:   Number(c.high),
      low:    Number(c.low),
      close:  Number(c.close),
      volume: Number(c.volume || 0),
    }));

    return res.json({ success: true, data: valid, symbol, interval, source, count: valid.length });
  } catch (err) {
    console.error('[Chart] Unexpected error:', err.message);
    return res.json({ success: true, data: [], symbol: req.query.symbol || '', interval: req.query.interval || '1h', count: 0 });
  }
});

// ── Health endpoint ──
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Market provider health ──
app.get('/api/market/health', async (_req, res) => {
  try {
    const marketService = require('./services/market/market.service');
    const health = await marketService.getHealth();
    res.json({ success: true, data: health });
  } catch {
    res.json({ success: true, data: [], message: 'Market service not available' });
  }
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message || err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('[db] MongoDB connected');

  await seedAdmin();
  await seedNetworkFees();

  try { await require('./scripts/seedConversionConfig')(); } catch (e) { console.warn('[Seed] ConversionConfig:', e.message); }
  try { await require('./scripts/migrateBalances')(); }        catch (e) { console.warn('[Migrate] Balances:', e.message); }
  try { await require('./scripts/migrateLockedBalances')(); }  catch (e) { console.warn('[Migrate] LockedBalances:', e.message); }
  try { await require('./scripts/seedTradingConfig')(); }      catch (e) { console.warn('[Seed] TradingConfig:', e.message); }
  try { await require('./services/tradeResolver').resumePendingOnBoot(); } catch (e) { console.warn('[TradeResolver] Boot recovery:', e.message); }
  try { await require('./scripts/seedSupportConfig')(); }      catch (e) { console.warn('[Seed] SupportConfig:', e.message); }

  const server = app.listen(PORT, () => {
    console.log(`[API] Running on :${PORT}`);
    console.log('[System] New market.service + market.aggregator active');
    console.log('[System] forexAggregator active for forex/metals');
    console.log('[System] Synthetic fallback: always returns data');
  });

  // Initialize WebSocket broadcaster
  try {
    const { initClientBroadcaster } = require('./services/market/websocket/client.broadcaster');
    initClientBroadcaster(server);
    console.log('[WS] Market WebSocket initialized on /ws/market');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('[WS] WebSocket module not found — REST polling mode');
    } else {
      console.warn('[WS] WebSocket init skipped:', err.message);
    }
  }

}).catch(e => { console.error('[DB] Connect failed:', e); process.exit(1); });