// src/services/market/websocket/stream.manager.js
// ── BINANCE WEBSOCKET STREAM MANAGER (FIXED — HANDLES ECONNRESET) ──

const WebSocket = require('ws');
const { WS_RECONNECT } = require('../constants');

const streams = new Map();

function buildWsUrl(symbol) {
  return `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`;
}

function parseTicker(raw, symbol) {
  try {
    const d = JSON.parse(raw);
    return {
      symbol,
      price: parseFloat(d.c),
      change24h: parseFloat(d.P),
      high24h: parseFloat(d.h),
      low24h: parseFloat(d.l),
      volume24h: parseFloat(d.q),
      timestamp: Date.now(),
      provider: 'binance-ws',
    };
  } catch {
    return null;
  }
}

function subscribeStream(symbol, cb) {
  const key = symbol.toUpperCase();

  let entry = streams.get(key);
  
  if (!entry) {
    entry = {
      ws: null,
      subscribers: new Set(),
      reconnects: 0,
      reconnTimer: null,
      connecting: false,
      closed: false,
    };
    streams.set(key, entry);
  }

  entry.subscribers.add(cb);
  console.log(`[WS-Stream] ${key}: ${entry.subscribers.size} subscriber(s)`);

  if (!entry.closed && !entry.ws && !entry.connecting) {
    openStream(key);
  }

  return () => {
    entry.subscribers.delete(cb);
    const remaining = entry.subscribers.size;
    console.log(`[WS-Stream] ${key}: ${remaining} subscriber(s) remaining`);
    
    if (remaining === 0) {
      closeStream(key);
    }
  };
}

function openStream(key) {
  const entry = streams.get(key);
  if (!entry || entry.closed) return;
  if (entry.connecting) return;
  
  // Don't open if already open
  if (entry.ws) {
    const state = entry.ws.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
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
  });

  ws.on('message', (raw) => {
    const ticker = parseTicker(raw.toString(), key);
    if (!ticker) return;

    entry.subscribers.forEach((cb) => {
      try { cb(ticker); } catch {}
    });
  });

  // ⚠️ CRITICAL FIX: Catch ALL errors to prevent server crash
  ws.on('error', (err) => {
    // ECONNRESET, ETIMEDOUT, etc. are network-level errors — log and ignore
    console.error(`[WS-Stream] Error ${key}: ${err.code || err.message}`);
    // Don't crash — the 'close' event will fire after this
    entry.connecting = false;
  });

  ws.on('close', (code, reason) => {
    entry.ws = null;
    entry.connecting = false;
    
    // Only reconnect if we still have subscribers AND not intentionally closed
    if (!entry.closed && entry.subscribers.size > 0) {
      console.warn(`[WS-Stream] Closed: ${key} (code: ${code}). Reconnecting...`);
      scheduleReconnect(key);
    } else {
      console.log(`[WS-Stream] Closed: ${key} (no subscribers or intentionally closed)`);
    }
  });
}

function scheduleReconnect(key) {
  const entry = streams.get(key);
  if (!entry || entry.closed) return;
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
  
  if (entry.reconnTimer) {
    clearTimeout(entry.reconnTimer);
    entry.reconnTimer = null;
  }
  
  if (entry.ws) {
    const ws = entry.ws;
    
    // ⚠️ CRITICAL: Remove ALL listeners before closing
    ws.removeAllListeners();
    
    // Only close if open
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.close(1000, 'No subscribers');
      } catch (err) {
        // Ignore close errors
      }
    } else if (ws.readyState === WebSocket.CONNECTING) {
      // Wait for it to finish connecting, then close
      ws.on('open', () => {
        try { ws.close(1000, 'No subscribers'); } catch {}
      });
    }
    
    entry.ws = null;
  }
  
  entry.subscribers.clear();
  entry.connecting = false;
  streams.delete(key);
  
  console.log(`[WS-Stream] Closed stream for ${key} (no subscribers)`);
}

function getStreamCount() {
  return streams.size;
}

function getActiveStreams() {
  const active = [];
  for (const [key, entry] of streams) {
    active.push({
      symbol: key,
      subscribers: entry.subscribers.size,
      state: entry.ws ? entry.ws.readyState : 'null',
      reconnects: entry.reconnects,
    });
  }
  return active;
}

// ⚠️ CRITICAL: Catch uncaught WebSocket errors globally
process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    console.warn('[WS-Stream] Suppressed network error:', err.code);
    return; // Don't crash on network errors
  }
  console.error('[WS-Stream] Uncaught exception:', err);
});

module.exports = {
  subscribeStream,
  getStreamCount,
  getActiveStreams,
};