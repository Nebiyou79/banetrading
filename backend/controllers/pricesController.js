// controllers/pricesController.js
// ── MARKETS CONTROLLER (CRYPTO + FOREX + METALS) ──
// Uses the new market aggregator system exclusively.

const { BY_SYMBOL } = require('../config/coins');
const { FX_BY_SYMBOL } = require('../config/forex');
const { METAL_BY_SYMBOL } = require('../config/metals');

// ── Lazy-load aggregators ──
let _marketAggregator = null;
let _forexAggregator = null;
let _marketService = null;

function getMarketAggregator() {
  if (!_marketAggregator) {
    try {
      _marketAggregator = require('../services/market/market.aggregator');
    } catch (e) {
      console.warn('[pricesController] market.aggregator unavailable:', e.message);
      _marketAggregator = null;
    }
  }
  return _marketAggregator;
}

function getForexAggregator() {
  if (!_forexAggregator) {
    try {
      _forexAggregator = require('../services/forexAggregator');
    } catch (e) {
      console.warn('[pricesController] forexAggregator unavailable:', e.message);
      _forexAggregator = null;
    }
  }
  return _forexAggregator;
}

function getMarketService() {
  if (!_marketService) {
    try {
      _marketService = require('../services/market/market.service');
    } catch (e) {
      console.warn('[pricesController] market.service unavailable:', e.message);
      _marketService = null;
    }
  }
  return _marketService;
}

// ── GET /api/markets/list — Crypto list ──
exports.list = async (req, res) => {
  try {
    // Try market.service first (uses Redis cache + all providers)
    const marketService = getMarketService();
    if (marketService) {
      try {
        const markets = await marketService.getMarkets();
        if (markets && markets.length > 0) {
          // Shape markets into the legacy MarketRow format expected by the frontend
          const rows = markets.map((m) => ({
            symbol:      m.symbol?.replace('USDT', '') || m.symbol,
            name:        m.name || m.symbol,
            iconUrl:     m.image || null,
            color:       BY_SYMBOL[m.symbol?.replace('USDT', '')]?.color || null,
            price:       m.price ?? null,
            change24h:   m.change24h ?? null,
            high24h:     m.high24h ?? null,
            low24h:      m.low24h ?? null,
            volume24h:   m.volume24h ?? null,
            marketCap:   m.marketCap ?? null,
            sparkline7d: [],
            source:      m.provider || 'market-service',
          }));
          return res.json({ rows, source: 'market-service', stale: false });
        }
      } catch (err) {
        console.warn('[pricesController.list] market.service failed:', err.message);
      }
    }

    // Fallback: use market.aggregator directly
    const agg = getMarketAggregator();
    if (!agg) {
      return res.status(503).json({ message: 'Price feed temporarily unavailable.' });
    }

    const result = await agg.getAggregatedMarkets();
    const markets = result?.data || [];

    if (markets.length === 0) {
      return res.status(503).json({ message: 'Price feed temporarily unavailable. Please retry.' });
    }

    // Shape into legacy MarketRow format
    const rows = markets.map((m) => {
      const sym = m.symbol?.replace('USDT', '') || m.symbol;
      return {
        symbol:      sym,
        name:        m.name || sym,
        iconUrl:     m.image || null,
        color:       BY_SYMBOL[sym]?.color || null,
        price:       m.price ?? null,
        change24h:   m.change24h ?? null,
        high24h:     m.high24h ?? null,
        low24h:      m.low24h ?? null,
        volume24h:   m.volume24h ?? null,
        marketCap:   m.marketCap ?? null,
        sparkline7d: [],
        source:      result.provider || 'aggregator',
      };
    });

    return res.json({ rows, source: result.provider || 'aggregator', stale: false });
  } catch (err) {
    console.error('Markets list error:', err);
    return res.status(503).json({ message: 'Price feed temporarily unavailable. Please retry.' });
  }
};

// ── GET /api/markets/forex — Forex list ──
exports.forexList = async (req, res) => {
  try {
    const forexAgg = getForexAggregator();
    if (!forexAgg) {
      return res.status(503).json({ message: 'Forex feed temporarily unavailable.' });
    }
    const result = await forexAgg.getForexAndMetals();
    const forexOnly = { ...result, rows: result.rows.filter((r) => r.class === 'forex') };
    return res.json(forexOnly);
  } catch (err) {
    console.error('Forex list error:', err);
    return res.status(503).json({ message: 'Forex feed temporarily unavailable.' });
  }
};

// ── GET /api/markets/metals — Metals list ──
exports.metalsList = async (req, res) => {
  try {
    const forexAgg = getForexAggregator();
    if (!forexAgg) {
      return res.status(503).json({ message: 'Metals feed temporarily unavailable.' });
    }
    const result = await forexAgg.getForexAndMetals();
    const metalsOnly = { ...result, rows: result.rows.filter((r) => r.class === 'metals') };
    return res.json(metalsOnly);
  } catch (err) {
    console.error('Metals list error:', err);
    return res.status(503).json({ message: 'Metals feed temporarily unavailable.' });
  }
};

// ── GET /api/markets/all — Unified crypto + forex + metals ──
exports.allList = async (req, res) => {
  try {
    const marketService = getMarketService();
    const forexAgg = getForexAggregator();

    const [cryptoResult, fxResult] = await Promise.allSettled([
      marketService
        ? marketService.getMarkets().catch(() => null)
        : Promise.resolve(null),
      forexAgg
        ? forexAgg.getForexAndMetals().catch(() => null)
        : Promise.resolve(null),
    ]);

    const rows = [];

    if (cryptoResult.status === 'fulfilled' && cryptoResult.value) {
      const cryptoMarkets = Array.isArray(cryptoResult.value) ? cryptoResult.value : [];
      cryptoMarkets.forEach((m) => {
        const sym = m.symbol?.replace('USDT', '') || m.symbol;
        rows.push({
          symbol:      sym,
          name:        m.name || sym,
          iconUrl:     m.image || null,
          color:       BY_SYMBOL[sym]?.color || null,
          price:       m.price ?? null,
          change24h:   m.change24h ?? null,
          high24h:     m.high24h ?? null,
          low24h:      m.low24h ?? null,
          volume24h:   m.volume24h ?? null,
          marketCap:   m.marketCap ?? null,
          sparkline7d: [],
          source:      m.provider || 'market-service',
          class:       'crypto',
        });
      });
    }

    if (fxResult.status === 'fulfilled' && fxResult.value) {
      fxResult.value.rows?.forEach((r) => rows.push(r));
    }

    return res.json({
      rows,
      source: 'combined',
      stale:  false,
    });
  } catch (err) {
    console.error('All markets error:', err);
    return res.status(503).json({ message: 'Price feed temporarily unavailable.' });
  }
};

// ── GET /api/markets/:symbol — Single symbol (auto-detect class) ──
exports.one = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    // ── Crypto ──
    if (BY_SYMBOL[symbol]) {
      const marketService = getMarketService();
      if (marketService) {
        try {
          const priceData = await marketService.getPrice(symbol + 'USDT');
          if (priceData?.price) {
            const meta = BY_SYMBOL[symbol];
            const row = {
              symbol,
              name:        meta.name,
              iconUrl:     null,
              color:       meta.color,
              price:       priceData.price,
              change24h:   priceData.change24h ?? null,
              high24h:     priceData.high24h ?? null,
              low24h:      priceData.low24h ?? null,
              volume24h:   priceData.volume24h ?? null,
              marketCap:   null,
              sparkline7d: [],
              source:      priceData.provider || 'market-service',
              class:       'crypto',
            };
            return res.json({ row, source: row.source, stale: false });
          }
        } catch (e) {
          console.warn('[pricesController.one] market.service failed:', e.message);
        }
      }
      return res.status(503).json({ message: 'Price data temporarily unavailable' });
    }

    // ── Forex or Metals ──
    if (FX_BY_SYMBOL[symbol] || METAL_BY_SYMBOL[symbol]) {
      const forexAgg = getForexAggregator();
      if (!forexAgg) return res.status(503).json({ message: 'Feed unavailable' });
      const { rows, source, stale } = await forexAgg.getForexAndMetals();
      const row = rows.find((r) => r.symbol === symbol);
      if (!row) return res.status(404).json({ message: 'Symbol not in market list' });
      return res.json({ row, source, stale });
    }

    return res.status(404).json({ message: 'Unknown symbol' });
  } catch (err) {
    console.error('Market one error:', err);
    return res.status(503).json({ message: 'Price feed temporarily unavailable' });
  }
};

// ── GET /api/markets/:symbol/ohlc — OHLC candles (auto-detect class) ──
exports.ohlc = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 500 } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 500, 1000);

    // Try market.service first (has full cascade + synthetic fallback)
    const marketService = getMarketService();
    if (marketService) {
      try {
        const candles = await marketService.getCandles(symbol, interval, parsedLimit);
        if (candles && candles.length > 0) {
          return res.json({ candles, source: 'market-service' });
        }
      } catch (err) {
        console.warn('[pricesController.ohlc] market.service failed:', err.message);
        // Surface 400 errors (e.g. sub-hourly FX restriction) directly
        if (err.statusCode === 400) {
          return res.status(400).json({ message: err.message });
        }
      }
    }

    // Fallback: ohlcProvider (has FX sub-hourly restriction built in)
    try {
      const ohlcProvider = require('../services/ohlcProvider');
      const data = await ohlcProvider.getOhlc(symbol, interval, parsedLimit);
      return res.json(data);
    } catch (err) {
      return res.status(err.statusCode || 503).json({
        message: err.message || 'Chart data unavailable',
      });
    }
  } catch (err) {
    console.error('OHLC error:', err);
    return res.status(err.statusCode || 503).json({
      message: err.message || 'Chart data unavailable',
    });
  }
};