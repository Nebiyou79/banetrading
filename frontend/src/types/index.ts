// types/index.ts — Shared TypeScript types for LunoTrading V2
// NOTE: This file re-exports from the modular type files.
// For admin module, use the specific type files directly.

// ── Re-export from modular types ──
export type { User, UserRole, KycStatus, LoginResponse } from './auth';

// ── Admin Stats (defined here since it's a composite type) ──
export interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  pendingDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalTrades: number;
  openTickets: number;
  // Legacy fields (kept for backward compatibility)
  newToday?: number;
  activeTrades?: number;
  platformBalance?: number;
  totalFeesCollected?: number;
}

// ── KYC ───────────────────────────────────────────────────────────────────
export interface KycStatusData {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  tier: number;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents: {
    idFront: boolean;
    idBack: boolean;
    selfie: boolean;
    proofOfAddress: boolean;
  };
  message?: string;
}

// ── Funds (legacy shapes - prefer types/funds.ts for new code) ────────────
export interface Deposit {
  _id: string;
  userId: string | { _id: string; email: string; name: string; displayName?: string };
  amount: number;
  currency: 'USDT' | 'BTC' | 'ETH';
  network?: string;
  proofFilePath?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  _id: string;
  userId: string | { _id: string; email: string; name: string; displayName?: string };
  amount: number;
  currency: 'USDT' | 'BTC' | 'ETH';
  network?: string;
  toAddress?: string;
  networkFee?: number;
  netAmount?: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  txHash?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
  network: string;
}

export interface DepositAddressesData {
  usdtAddress: string;
  btcAddress: string;
  ethAddress: string;
}

// ── Trades (legacy shape - prefer types/trade.ts for new code) ────────────
export interface Trade {
  _id: string;
  user?: string | { _id: string; email: string; name: string };
  userId?: string;
  pair?: string;
  pairDisplay?: string;
  pairClass?: string;
  assetId?: string;
  assetSymbol?: string;
  priceAtEntry?: number;
  entryPrice?: number;
  exitPrice?: number;
  capital?: number;
  stake?: number;
  returnRate?: number;
  planKey?: string;
  planMultiplier?: number;
  direction?: string;
  status: 'pending' | 'win' | 'lose' | 'won' | 'lost' | 'cancelled';
  resultAmount?: number;
  payout?: number;
  netResult?: number;
  transactionFee?: number;
  feeAmount?: number;
  duration?: number;
  planDurationSec?: number;
  autoMode?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceTradeRequest {
  assetId: string;
  assetSymbol: string;
  priceAtEntry: number;
  capital: number;
  returnRate: number;
  direction: string;
  duration: number;
}

// ── Prices ────────────────────────────────────────────────────────────────
export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number | null;
  low24h: number | null;
  marketCap: number | null;
  image: string | null;
  source: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ── Announcements ─────────────────────────────────────────────────────────
export interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

// ── Support (legacy shapes) ───────────────────────────────────────────────
export interface SupportMessage {
  _id: string;
  userId: string;
  sender: 'user' | 'admin';
  message: string;
  read: boolean;
  ticketId: string;
  createdAt: string;
}

export interface SupportConversation {
  _id: string;
  ticketId: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  user: {
    name: string;
    email: string;
  };
}

// ── Transactions (unified) ────────────────────────────────────────────────
export type Transaction = (Deposit | Withdrawal | Trade) & {
  txType: 'deposit' | 'withdrawal' | 'trade';
};

// ── API Errors ────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
  action?: string;
  reason?: string;
}