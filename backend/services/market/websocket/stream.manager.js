// src/services/market/websocket/stream.manager.js
// ── BINANCE WEBSOCKET STREAM MANAGER ──
// ONE connection per symbol, shared across all browser clients

const WebSocket = require('ws');
const { WS_RECONNECT } = require('../constants');
const { setCachedPrice, setCachedTicker } = require('../cache/market.cache');

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
  
  if (!streams.has(key)) {
    streams.set(key, {
      ws: null,
      subscribers: new Set(),
      reconnects: 0,
      reconnTimer: null,
    });
  }
  
  const entry = streams.get(key);
  entry.subscribers.add(cb);
  
  if (!entry.ws || entry.ws.readyState === WebSocket.CLOSED) {
    openStream(key);
  }
  
  return () => {
    entry.subscribers.delete(cb);
    if (entry.subscribers.size === 0) {
      closeStream(key);
    }
  };
}

function openStream(key) {
  const entry = streams.get(key);
  if (!entry) return;
  
  const ws = new WebSocket(buildWsUrl(key));
  entry.ws = ws;
  
  ws.on('open', () => {
    console.log(`[WS] Connected: ${key}`);
    entry.reconnects = 0;
  });
  
  ws.on('message', async (raw) => {
    const ticker = parseTicker(raw.toString(), key);
    if (!ticker) return;
    
    // Update cache
    setCachedPrice(key, ticker).catch(() => {});
    setCachedTicker(key, ticker).catch(() => {});
    
    // Broadcast to all subscribers
    entry.subscribers.forEach(cb => {
      try { cb(ticker); } catch { /* subscriber errors shouldn't crash */ }
    });
  });
  
  ws.on('error', (err) => {
    console.error(`[WS] Error ${key}:`, err.message);
  });
  
  ws.on('close', () => {
    console.warn(`[WS] Closed: ${key}. Reconnecting...`);
    scheduleReconnect(key);
  });
}

function scheduleReconnect(key) {
  const entry = streams.get(key);
  if (!entry || entry.subscribers.size === 0) return;
  
  if (entry.reconnects >= WS_RECONNECT.MAX_ATTEMPTS) {
    console.error(`[WS] Max reconnects for ${key}`);
    return;
  }
  
  const delay = Math.min(
    WS_RECONNECT.INITIAL_DELAY * Math.pow(WS_RECONNECT.MULTIPLIER, entry.reconnects),
    WS_RECONNECT.MAX_DELAY
  );
  entry.reconnects++;
  
  entry.reconnTimer = setTimeout(() => openStream(key), delay);
}

function closeStream(key) {
  const entry = streams.get(key);
  if (!entry) return;
  if (entry.reconnTimer) clearTimeout(entry.reconnTimer);
  if (entry.ws) {
    entry.ws.close();
  }
  streams.delete(key);
  console.log(`[WS] Closed ${key} (no subscribers)`);
}

module.exports = {
  subscribeStream,
};