// services/market/websocket/stream.manager.js
// ── BINANCE WEBSOCKET STREAM MANAGER ──
// FIXED: Max-consecutive-failures counter prevents infinite ECONNRESET flood.
// After MAX_CONSECUTIVE_NETWORK_FAILS ECONNRESET errors, marks stream as
// temporarily unreachable for BLACKOUT_MS (5 min) instead of reconnecting infinitely.

const WebSocket = require('ws');
const { WS_RECONNECT } = require('../constants');

const MAX_CONSECUTIVE_NETWORK_FAILS = 3;
const BLACKOUT_MS = 5 * 60 * 1000; // 5 minutes

/** @type {Map<string, StreamEntry>} */
const streams = new Map();

/** @type {Map<string, { count: number, since: number }>} */
const consecutiveFailures = new Map();

function buildWsUrl(symbol) {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
}

function parseTicker(raw, symbol) {
  try {
    const d = JSON.parse(raw);
    return {
      symbol,
      price:    parseFloat(d.c),
      change24h:parseFloat(d.P),
      high24h:  parseFloat(d.h),
      low24h:   parseFloat(d.l),
      volume24h:parseFloat(d.q),
      timestamp:Date.now(),
      provider: 'binance-ws',
    };
  } catch { return null; }
}

function recordFailure(key) {
  const existing = consecutiveFailures.get(key) || { count: 0, since: Date.now() };
  existing.count += 1;
  consecutiveFailures.set(key, existing);
  return existing.count;
}

function clearFailures(key) {
  consecutiveFailures.delete(key);
}

function isNetworkError(err) {
  const codes = ['ECONNRESET','ETIMEDOUT','ECONNREFUSED','ENOTFOUND','ENETUNREACH','EHOSTUNREACH'];
  return codes.includes(err.code);
}

function isBlacklisted(key) {
  const entry = streams.get(key);
  if (!entry || !entry.blacklistedUntil) return false;
  if (Date.now() >= entry.blacklistedUntil) {
    entry.blacklistedUntil = null;
    clearFailures(key);
    console.log(`[WS-Stream] ${key}: Blackout expired — will retry`);
    return false;
  }
  return true;
}

function subscribeStream(symbol, cb) {
  const key = symbol.toUpperCase();
  let entry = streams.get(key);
  if (!entry) {
    entry = { ws: null, subscribers: new Set(), reconnects: 0, reconnTimer: null, connecting: false, closed: false, blacklistedUntil: null };
    streams.set(key, entry);
  }
  entry.subscribers.add(cb);
  console.log(`[WS-Stream] ${key}: ${entry.subscribers.size} subscriber(s)`);

  if (!entry.closed && !entry.ws && !entry.connecting && !isBlacklisted(key)) {
    openStream(key);
  } else if (isBlacklisted(key)) {
    const remaining = Math.ceil((entry.blacklistedUntil - Date.now()) / 1000);
    console.warn(`[WS-Stream] ${key}: Blacklisted for ${remaining}s — REST polling fallback active`);
  }

  return () => {
    entry.subscribers.delete(cb);
    if (entry.subscribers.size === 0) closeStream(key);
  };
}

function openStream(key) {
  const entry = streams.get(key);
  if (!entry || entry.closed || isBlacklisted(key)) return;
  if (entry.connecting) return;
  if (entry.ws) {
    const s = entry.ws.readyState;
    if (s === WebSocket.OPEN || s === WebSocket.CONNECTING) return;
  }

  entry.connecting = true;
  let ws;
  try {
    ws = new WebSocket(buildWsUrl(key));
  } catch (err) {
    console.error(`[WS-Stream] Failed to create WebSocket for ${key}:`, err.message);
    entry.connecting = false;
    scheduleReconnect(key);
    return;
  }
  entry.ws = ws;

  ws.on('open', () => {
    console.log(`[WS-Stream] Connected: ${key}`);
    entry.reconnects = 0;
    entry.connecting = false;
    clearFailures(key); // successful connect resets failure counter
  });

  ws.on('message', (raw) => {
    const ticker = parseTicker(raw.toString(), key);
    if (!ticker) return;
    entry.subscribers.forEach(cb => { try { cb(ticker); } catch {} });
  });

  // CRITICAL: catch ALL errors — ECONNRESET fires here before 'close'
  ws.on('error', (err) => {
    console.error(`[WS-Stream] Error ${key}: ${err.code || err.message}`);
    entry.connecting = false;

    if (isNetworkError(err)) {
      const failCount = recordFailure(key);
      console.warn(`[WS-Stream] ${key}: Consecutive network errors: ${failCount}/${MAX_CONSECUTIVE_NETWORK_FAILS}`);

      if (failCount >= MAX_CONSECUTIVE_NETWORK_FAILS) {
        // BLACKOUT — stop hammering the server
        entry.blacklistedUntil = Date.now() + BLACKOUT_MS;
        if (entry.reconnTimer) { clearTimeout(entry.reconnTimer); entry.reconnTimer = null; }
        console.error(`[WS-Stream] ${key}: BLACKLISTED for ${BLACKOUT_MS / 60000} min after ${failCount} consecutive network errors. Falling back to REST polling.`);
      }
    }
    // 'close' event fires after 'error' and handles reconnect
  });

  ws.on('close', (code) => {
    entry.ws = null;
    entry.connecting = false;
    if (isBlacklisted(key)) {
      console.log(`[WS-Stream] ${key}: Closed while blacklisted — not reconnecting`);
      return;
    }
    if (!entry.closed && entry.subscribers.size > 0) {
      console.warn(`[WS-Stream] Closed: ${key} (code: ${code}). Reconnecting…`);
      scheduleReconnect(key);
    }
  });
}

function scheduleReconnect(key) {
  const entry = streams.get(key);
  if (!entry || entry.closed || isBlacklisted(key)) return;
  if (entry.subscribers.size === 0) return;
  if (entry.reconnects >= WS_RECONNECT.MAX_ATTEMPTS) {
    console.error(`[WS-Stream] Max reconnects for ${key} — giving up`);
    streams.delete(key);
    return;
  }
  const delay = Math.min(
    WS_RECONNECT.INITIAL_DELAY * Math.pow(WS_RECONNECT.MULTIPLIER, entry.reconnects),
    WS_RECONNECT.MAX_DELAY
  );
  entry.reconnects++;
  if (entry.reconnTimer) clearTimeout(entry.reconnTimer);
  entry.reconnTimer = setTimeout(() => openStream(key), delay);
  console.log(`[WS-Stream] ${key}: Reconnect in ${delay}ms (attempt ${entry.reconnects})`);
}

function closeStream(key) {
  const entry = streams.get(key);
  if (!entry) return;
  entry.closed = true;
  if (entry.reconnTimer) { clearTimeout(entry.reconnTimer); entry.reconnTimer = null; }
  if (entry.ws) {
    const ws = entry.ws;
    ws.removeAllListeners();
    if (ws.readyState === WebSocket.OPEN) { try { ws.close(1000, 'No subscribers'); } catch {} }
    else if (ws.readyState === WebSocket.CONNECTING) { ws.on('open', () => { try { ws.close(1000, 'No subscribers'); } catch {} }); }
    entry.ws = null;
  }
  entry.subscribers.clear();
  entry.connecting = false;
  streams.delete(key);
  clearFailures(key);
  console.log(`[WS-Stream] Closed stream for ${key}`);
}

function getStreamCount() { return streams.size; }

function getActiveStreams() {
  return [...streams.entries()].map(([key, entry]) => ({
    symbol:           key,
    subscribers:      entry.subscribers.size,
    state:            entry.ws ? entry.ws.readyState : 'null',
    reconnects:       entry.reconnects,
    blacklistedUntil: entry.blacklistedUntil,
    consecutiveFails: (consecutiveFailures.get(key) || {}).count || 0,
  }));
}

// Suppress uncaught WebSocket / network errors at process level
process.on('uncaughtException', (err) => {
  if (isNetworkError(err)) {
    console.warn('[WS-Stream] Suppressed uncaught network error:', err.code);
    return;
  }
  console.error('[WS-Stream] Uncaught exception (non-network):', err);
  throw err;
});

module.exports = { subscribeStream, getStreamCount, getActiveStreams };