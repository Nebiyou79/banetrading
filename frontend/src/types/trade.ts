// types/trade.ts
// ── TRADING MODULE TYPES (Module 7) ──

import type { Currency } from './convert';

export type TradeDirection = 'buy' | 'sell';
export type TradeStatus = 'pending' | 'won' | 'lost' | 'cancelled';
export type PairClass = 'crypto' | 'forex' | 'metals';
export type PlanKey = 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ELITE';
export type AutoMode = 'off' | 'random' | 'alwaysWin' | 'alwaysLose';

export interface TradingPlan {
  key: PlanKey;
  multiplier: number;     // 0.12 = +12%
  durationSec: number;
  minUsd: number;
  active: boolean;
}

export interface TradingConfigResponse {
  plans: TradingPlan[];
  feeBps: number;         // 200 = 2%
  enabledPairs: string[]; // empty = all
}

export interface TradingPair {
  symbol: string;         // 'BTCUSDT' | 'EURUSD' | 'XAUUSD'
  display: string;        // 'BTC/USDT'
  base: string;           // 'BTC'
  quote: string;          // 'USDT'
  name: string;
  color?: string;
}

export interface TradingPairsResponse {
  crypto: TradingPair[];
  forex: TradingPair[];
  metals: TradingPair[];
}

export interface PlaceTradeRequest {
  pair: string;
  direction: TradeDirection;
  planKey: PlanKey;
  tradingAsset: Currency;
  stake: number;
}

export interface Trade {
  _id: string;
  userId: string;
  pair: string;
  pairClass: PairClass;
  pairDisplay: string;
  direction: TradeDirection;
  tradingAsset: Currency;
  stake: number;
  planKey: PlanKey;
  planMultiplier: number;
  planDurationSec: number;
  feeBps: number;
  entryPrice: number;
  expiresAt: string;
  resolveAt: string;
  status: TradeStatus;
  resolvedAt?: string;
  exitPrice?: number;
  payout?: number;
  netResult?: number;
  feeAmount?: number;
  resolvedBy?: 'auto-win' | 'auto-lose' | 'random-win' | 'random-lose' | 'admin' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface PlaceTradeResponse {
  trade: Trade;
}

export interface ActiveTradesResponse {
  trades: Trade[];
}

export interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
  limit: number;
  offset: number;
}

export interface SingleTradeResponse {
  trade: Trade;
}