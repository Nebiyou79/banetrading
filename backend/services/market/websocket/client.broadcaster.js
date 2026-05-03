// src/services/market/websocket/client.broadcaster.js
// ── BROWSER CLIENT BROADCASTER (FIXED) ──

const WebSocket = require('ws');
const { subscribeStream } = require('./stream.manager');

function initClientBroadcaster(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer, path: '/ws/market' });

  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    const mySubscriptions = new Map();
    const mySymbols = new Set();
    
    console.log(`[WS-Broadcast] Client connected: ${id}`);

    // ⚠️ CRITICAL: Handle client WebSocket errors
    ws.on('error', (err) => {
      console.error(`[WS-Broadcast] Client error ${id}:`, err.code || err.message);
      // Don't crash — just log
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'subscribe' && msg.symbol) {
          const symbol = msg.symbol.toUpperCase();
          if (mySymbols.has(symbol)) return;
          
          mySymbols.add(symbol);
          
          const unsub = subscribeStream(symbol, (ticker) => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'ticker', data: ticker }));
              } catch {}
            }
          });
          
          mySubscriptions.set(symbol, unsub);
          console.log(`[WS-Broadcast] ${id} subscribed to ${symbol}`);
        }

        if (msg.type === 'unsubscribe' && msg.symbol) {
          const symbol = msg.symbol.toUpperCase();
          const unsub = mySubscriptions.get(symbol);
          if (unsub) {
            unsub();
            mySubscriptions.delete(symbol);
            mySymbols.delete(symbol);
            console.log(`[WS-Broadcast] ${id} unsubscribed from ${symbol}`);
          }
        }
      } catch {}
    });

    ws.on('close', () => {
      console.log(`[WS-Broadcast] Client disconnected: ${id}`);
      for (const [symbol, unsub] of mySubscriptions) {
        unsub();
        console.log(`[WS-Broadcast] ${id} cleaned up ${symbol}`);
      }
      mySubscriptions.clear();
      mySymbols.clear();
    });

    ws.send(JSON.stringify({ type: 'connected', id }));
  });

  // ⚠️ CRITICAL: Handle WebSocket server errors
  wss.on('error', (err) => {
    console.error('[WS-Broadcast] Server error:', err.code || err.message);
    // Don't crash
  });

  console.log('[WS-Broadcast] Server ready on /ws/market');
  return wss;
}

module.exports = { initClientBroadcaster };