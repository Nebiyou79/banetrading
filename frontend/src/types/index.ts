// types/index.ts — Shared TypeScript types for LunoTrading V2

// ── Auth ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  kycTier: number;
  kycStatus: 'pending' | 'accepted' | 'rejected' | 'verified';
  balance: number;
  country?: string;
  isFrozen?: boolean;
  freezeReason?: string;
  autoMode?: 'alwaysWin' | 'alwaysLose' | 'off';
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  country: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ── KYC ───────────────────────────────────────────────────────────────────
export interface KycStatus {
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

// ── Funds ─────────────────────────────────────────────────────────────────
export interface Deposit {
  _id: string;
  userId: string;
  amount: number;
  currency: 'USDT' | 'BTC' | 'ETH';
  proofFilePath: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  address: string;
  network: 'USDT-TRC20' | 'BTC' | 'ETH';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
  network: 'USDT-TRC20' | 'BTC' | 'ETH';
}

export interface DepositAddresses {
  usdtAddress: string;
  btcAddress: string;
  ethAddress: string;
}

// ── Trades ────────────────────────────────────────────────────────────────
export interface Trade {
  _id: string;
  user: string | User;
  assetId: string;
  assetSymbol: string;
  priceAtEntry: number;
  capital: number;
  returnRate: number;
  direction: 'up' | 'down';
  status: 'pending' | 'win' | 'lose';
  resultAmount: number;
  transactionFee: number;
  duration: number;
  autoMode: 'on' | 'off';
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
  direction: 'up' | 'down';
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

// ── Support ───────────────────────────────────────────────────────────────
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

// ── Admin ─────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  newToday: number;
  pendingDeposits: { count: number; totalValue: number };
  pendingWithdrawals: { count: number; totalValue: number };
  activeTrades: number;
  platformBalance: number;
  totalFeesCollected: number;
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
