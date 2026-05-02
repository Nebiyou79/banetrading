// hooks/useMarketWebSocket.ts
// ── WEBSOCKET HOOK (FIXED — CORRECT BACKEND PORT) ──

import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/stores/market.store';
import type { NormalizedTicker } from '@/types/markets';

// ⚠️ FIXED: Always use backend port 5000 for WebSocket
// WebSocket cannot be proxied by Next.js rewrites, so we must use the direct backend URL
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (typeof window !== 'undefined'
    ? `ws://${window.location.hostname}:5000/ws/market`
    : 'ws://localhost:5000/ws/market');

console.log('[WS] Using WebSocket URL:', WS_URL);

// ── Shared WebSocket (module-level singleton) ──
let sharedWs: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

// Track subscriptions at module level (NOT in Zustand — avoids infinite loops)
const moduleSubscribers = new Set<string>();

function getSharedSocket(): WebSocket | null {
  return sharedWs;
}

function connectShared(): void {
  // Already connected or connecting
  if (sharedWs?.readyState === WebSocket.OPEN) return;
  if (sharedWs?.readyState === WebSocket.CONNECTING) return;

  // Close stale socket if it exists
  if (sharedWs && sharedWs.readyState !== WebSocket.CLOSED) {
    sharedWs.onclose = null;
    sharedWs.onerror = null;
  }

  try {
    sharedWs = new WebSocket(WS_URL);
  } catch (err) {
    console.warn('[WS] Failed to create WebSocket — backend may not be running');
    scheduleReconnect();
    return;
  }

  sharedWs.onopen = () => {
    console.log('[WS] Connected to market stream');
    reconnectAttempts = 0;
    useMarketStore.getState().setWsConnected(true);

    // Re-subscribe all previously subscribed symbols
    for (const symbol of moduleSubscribers) {
      try {
        sharedWs?.send(JSON.stringify({ type: 'subscribe', symbol }));
      } catch {}
    }
  };

  sharedWs.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === 'connected') {
        console.log('[WS] Client ID:', msg.id);
        return;
      }

      if (msg.type === 'ticker' && msg.data) {
        const ticker = msg.data as NormalizedTicker;
        useMarketStore.getState().setTicker(ticker.symbol, ticker);
      }
    } catch {
      // Ignore malformed messages
    }
  };

  sharedWs.onclose = () => {
    console.warn('[WS] Disconnected from market stream');
    useMarketStore.getState().setWsConnected(false);
    sharedWs = null;
    scheduleReconnect();
  };

  sharedWs.onerror = () => {
    // onclose will fire after this
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  // Cap reconnection attempts at 5 (30s max delay)
  if (reconnectAttempts >= 5) {
    console.warn('[WS] Max reconnection attempts reached. Stopping reconnections.');
    return;
  }

  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
  reconnectAttempts++;

  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    connectShared();
  }, delay);
}

/**
 * Hook: Subscribe to WebSocket price updates for a symbol.
 * Safe to call from multiple components — uses a shared socket.
 */
export function useMarketWebSocket(symbol: string): void {
  const symbolRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run when symbol actually changes
    if (!symbol || symbol === symbolRef.current) return;

    const prevSymbol = symbolRef.current;

    // Unsubscribe from previous symbol
    if (prevSymbol) {
      moduleSubscribers.delete(prevSymbol);
      if (sharedWs?.readyState === WebSocket.OPEN) {
        try {
          sharedWs.send(JSON.stringify({ type: 'unsubscribe', symbol: prevSymbol }));
        } catch {}
      }
    }

    // Lazy-init WebSocket connection
    if (!sharedWs || sharedWs.readyState !== WebSocket.OPEN) {
      connectShared();
    }

    // Subscribe to new symbol
    if (!moduleSubscribers.has(symbol)) {
      moduleSubscribers.add(symbol);
      if (sharedWs?.readyState === WebSocket.OPEN) {
        try {
          sharedWs.send(JSON.stringify({ type: 'subscribe', symbol }));
        } catch {}
      }
    }

    symbolRef.current = symbol;
  }, [symbol]);
}

/**
 * Page-level hook: subscribes and cleans up on unmount.
 * Use this in page components (e.g., TradePage).
 */
export function usePageMarketWebSocket(symbol: string): void {
  const symbolRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run when symbol actually changes
    if (!symbol || symbol === symbolRef.current) return;

    const prevSymbol = symbolRef.current;

    // Cleanup previous subscription
    if (prevSymbol) {
      moduleSubscribers.delete(prevSymbol);
      if (sharedWs?.readyState === WebSocket.OPEN) {
        try {
          sharedWs.send(JSON.stringify({ type: 'unsubscribe', symbol: prevSymbol }));
        } catch {}
      }
    }

    // Connect if needed
    if (!sharedWs || sharedWs.readyState !== WebSocket.OPEN) {
      connectShared();
    }

    // Subscribe new symbol
    if (!moduleSubscribers.has(symbol)) {
      moduleSubscribers.add(symbol);
      if (sharedWs?.readyState === WebSocket.OPEN) {
        try {
          sharedWs.send(JSON.stringify({ type: 'subscribe', symbol }));
        } catch {}
      }
    }

    symbolRef.current = symbol;

    // Cleanup on unmount
    return () => {
      moduleSubscribers.delete(symbol);
      if (sharedWs?.readyState === WebSocket.OPEN) {
        try {
          sharedWs.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        } catch {}
      }
    };
  }, [symbol]);
}