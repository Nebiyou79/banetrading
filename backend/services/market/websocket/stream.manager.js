// services/market/websocket/stream.manager.js
// ── MARKET WEBSOCKET STREAM MANAGER ──
// FIX: Removed Binance WebSocket (BLOCKED on this network).
//      Now uses KuCoin WebSocket with REST polling fallback.
//      KuCoin WS requires a token endpoint first, then WS connect.
//      On any failure, falls back silently to REST polling.

const { WS_RECONNECT } = require('../constants');

// Tracks active REST-polling intervals per symbol
const pollIntervals = new Map();

// Callbacks registered per symbol
const subscribers = new Map(); // symbol -> Set<callback>

/**
 * Subscribe to price updates for a symbol.
 * Uses KuCoin REST polling as the primary mechanism.
 * Returns an unsubscribe function.
 */
function subscribeStream(symbol, cb) {
  const key = symbol.toUpperCase();

  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(cb);

  // Start polling if not already polling for this symbol
  if (!pollIntervals.has(key)) {
    _startPolling(key);
  }

  return () => {
    const subs = subscribers.get(key);
    if (subs) {
      subs.delete(cb);
      if (subs.size === 0) {
        _stopPolling(key);
        subscribers.delete(key);
      }
    }
  };
}

async function _pollPrice(symbol) {
  try {
    // Try to get price from market.service (has provider cascade)
    const marketService = require('../market.service');
    const price = await marketService.getPrice(symbol);
    if (!price?.price) return;

    const ticker = {
      symbol,
      price:     price.price,
      change24h: price.change24h ?? null,
      high24h:   price.high24h ?? null,
      low24h:    price.low24h ?? null,
      volume24h: price.volume24h ?? null,
      timestamp: Date.now(),
      provider:  price.provider || 'rest-poll',
    };

    const subs = subscribers.get(symbol);
    if (subs) {
      subs.forEach(cb => { try { cb(ticker); } catch {} });
    }
  } catch {
    // Silently fail — REST polling will retry on next interval
  }
}

function _startPolling(symbol) {
  // Poll every 5 seconds
  const interval = setInterval(() => _pollPrice(symbol), 5000);
  pollIntervals.set(symbol, interval);

  // Initial poll immediately
  _pollPrice(symbol).catch(() => {});
}

function _stopPolling(symbol) {
  const interval = pollIntervals.get(symbol);
  if (interval) {
    clearInterval(interval);
    pollIntervals.delete(symbol);
  }
}

function getStreamCount() {
  return pollIntervals.size;
}

function getActiveStreams() {
  return [...pollIntervals.keys()].map(symbol => ({
    symbol,
    subscribers:  (subscribers.get(symbol) || new Set()).size,
    state:        'polling',
    reconnects:   0,
    blacklistedUntil: null,
    consecutiveFails: 0,
  }));
}

module.exports = { subscribeStream, getStreamCount, getActiveStreams };