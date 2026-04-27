// types/profile.ts
// ── Profile / portfolio / transactions types ──

import type { User, KycStatus } from './auth';

export type { KycStatus };

export type UserProfile = User;

export type TransactionType = 'deposit' | 'withdrawal' | 'trade';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'won' | 'lost' | 'cancelled';

export interface RecentTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface BalanceEntry {
  currency: string;
  amount: number;
  usdValue: number;
  pct: number;
}

export interface Change24h {
  absolute: number;
  percent: number;
}

export interface Portfolio {
  totalBalanceUsd: number;
  balances: BalanceEntry[];
  change24h: Change24h;
  kyc: { status: KycStatus; tier: number };
  account: { isFrozen: boolean; verifiedAt: string | null };
}

export interface UpdateProfilePayload {
  name?: string;
  displayName?: string;
  country?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ── Response shapes ──
export interface ProfilePayloadResponse {
  user: UserProfile;
}

export interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

export interface AvatarResponse {
  message: string;
  avatarUrl?: string;
  user: UserProfile;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface RecentTransactionsResponse {
  transactions: RecentTransaction[];
}