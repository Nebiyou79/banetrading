// src/services/market/websocket/client.broadcaster.js
// ── BROWSER CLIENT BROADCASTER (via Socket.io or raw WebSocket) ──

const { subscribeStream } = require('./stream.manager');

/**
 * Initialize WebSocket server for browser clients.
 * @param {import('http').Server} server - HTTP server instance
 * @returns {import('ws').WebSocketServer}
 */
function initClientBroadcaster(httpServer) {
  const { WebSocketServer } = require('ws');
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/market' });
  
  // Client registry: clientId → { ws, symbols: Set, unsubs: Map }
  const clients = new Map();
  
  wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    clients.set(id, { ws, symbols: new Set(), unsubs: new Map() });
    
    console.log(`[WS-Broadcast] Client connected: ${id}`);
    
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        
        if (msg.type === 'subscribe' && msg.symbol) {
          handleSubscribe(id, msg.symbol);
        }
        if (msg.type === 'unsubscribe' && msg.symbol) {
          handleUnsubscribe(id, msg.symbol);
        }
      } catch {
        // ignore bad messages
      }
    });
    
    ws.on('close', () => {
      const client = clients.get(id);
      if (client) {
        client.unsubs.forEach((fn) => fn());
        clients.delete(id);
      }
      console.log(`[WS-Broadcast] Client disconnected: ${id}`);
    });
    
    ws.on('error', (err) => {
      console.error(`[WS-Broadcast] Client error ${id}:`, err.message);
    });
    
    // Acknowledge connection
    ws.send(JSON.stringify({ type: 'connected', id }));
  });
  
  function handleSubscribe(clientId, symbol) {
    const client = clients.get(clientId);
    if (!client || client.symbols.has(symbol)) return;
    
    client.symbols.add(symbol);
    
    // Subscribe to the Binance stream for this symbol
    const unsub = subscribeStream(symbol, (ticker) => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(JSON.stringify({ type: 'ticker', data: ticker }));
      }
    });
    
    client.unsubs.set(symbol, unsub);
    console.log(`[WS-Broadcast] ${clientId} subscribed to ${symbol}`);
  }
  
  function handleUnsubscribe(clientId, symbol) {
    const client = clients.get(clientId);
    if (!client) return;
    
    const unsub = client.unsubs.get(symbol);
    if (unsub) unsub();
    client.unsubs.delete(symbol);
    client.symbols.delete(symbol);
    console.log(`[WS-Broadcast] ${clientId} unsubscribed from ${symbol}`);
  }
  
  return wss;
}

/**
 * Setup using existing Socket.io instance (alternative)
 */
function initSocketIOBroadcaster(io) {
  const clients = new Map();
  
  io.on('connection', (socket) => {
    const id = socket.id;
    clients.set(id, { socket, symbols: new Set(), unsubs: new Map() });
    
    socket.on('market:subscribe', (symbol) => {
      const client = clients.get(id);
      if (!client || client.symbols.has(symbol)) return;
      
      client.symbols.add(symbol);
      
      const unsub = subscribeStream(symbol, (ticker) => {
        socket.emit('market:ticker', ticker);
      });
      
      client.unsubs.set(symbol, unsub);
    });
    
    socket.on('market:unsubscribe', (symbol) => {
      const client = clients.get(id);
      if (!client) return;
      
      const unsub = client.unsubs.get(symbol);
      if (unsub) unsub();
      client.unsubs.delete(symbol);
      client.symbols.delete(symbol);
    });
    
    socket.on('disconnect', () => {
      const client = clients.get(id);
      if (client) {
        client.unsubs.forEach(fn => fn());
        clients.delete(id);
      }
    });
  });
  
  return io;
}

module.exports = {
  initClientBroadcaster,
  initSocketIOBroadcaster,
};