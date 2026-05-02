// stores/market.store.ts
// ── ZUSTAND MARKET STORE (FIXED — NO INFINITE LOOPS) ──

import { create } from 'zustand';
import type { NormalizedTicker, AssetClass } from '@/types/markets';

interface MarketState {
  // Live prices keyed by normalized symbol (e.g., "BTCUSDT")
  prices: Record<string, number>;

  // Full ticker data keyed by symbol
  tickers: Record<string, NormalizedTicker>;

  // Active symbol and asset class for the trade page
  activeSymbol: string;
  activeAssetClass: AssetClass;
  activeInterval: string;

  // WebSocket connection state
  wsConnected: boolean;

  // Actions (NO subscribedSymbols in state — it's managed at module level in the hook)
  setPrice: (symbol: string, price: number) => void;
  setTicker: (symbol: string, ticker: NormalizedTicker) => void;
  setActiveSymbol: (symbol: string, assetClass?: AssetClass) => void;
  setActiveInterval: (interval: string) => void;
  setWsConnected: (connected: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  prices: {},
  tickers: {},
  activeSymbol: 'BTCUSDT',
  activeAssetClass: 'crypto',
  activeInterval: '1h',
  wsConnected: false,

  setPrice: (symbol, price) =>
    set((s) => {
      // Only update if price actually changed (prevents unnecessary re-renders)
      if (s.prices[symbol] === price) return s;
      return { prices: { ...s.prices, [symbol]: price } };
    }),

  setTicker: (symbol, ticker) =>
    set((s) => {
      // Only update if price actually changed
      const prevPrice = s.prices[symbol];
      if (prevPrice === ticker.price && s.tickers[symbol]?.timestamp === ticker.timestamp) {
        return s;
      }
      return {
        tickers: { ...s.tickers, [symbol]: ticker },
        prices: { ...s.prices, [symbol]: ticker.price },
      };
    }),

  setActiveSymbol: (symbol, assetClass = 'crypto') =>
    set({ activeSymbol: symbol, activeAssetClass: assetClass }),

  setActiveInterval: (interval) =>
    set({ activeInterval: interval }),

  setWsConnected: (connected) =>
    set({ wsConnected: connected }),
}));