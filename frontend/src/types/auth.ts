// types/auth.ts
// ── Authentication & User types for LunoTrading V2 ──

// ── User ──────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin';

export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  country?: string;
  phone?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  kycTier: number;
  kycStatus: KycStatus;
  balance: number;
  balances: {
    USDT: number;
    BTC: number;
    ETH: number;
    SOL: number;
    BNB: number;
    XRP: number;
  };
  lockedBalances: {
    USDT: number;
    BTC: number;
    ETH: number;
    SOL: number;
    BNB: number;
    XRP: number;
  };
  autoMode: 'off' | 'random' | 'alwaysWin' | 'alwaysLose';
  promoCodeUsed?: string;
  ownPromoCode?: string;
  referralCount: number;
  bonusUnlocked: boolean;
  bonusCreditedAt?: string;
  isFrozen: boolean;
  freezeReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Auth Payloads & Responses ─────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  country: string;
  promoCode?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  user?: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: 'email_verification' | 'password_reset';
}

export interface VerifyOtpResponse {
  message: string;
  resetToken?: string;
  user?: User;
}

export interface ResendOtpPayload {
  email: string;
  purpose: 'email_verification' | 'password_reset';
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  message: string;
  resetToken: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface ProfileResponse {
  user: User;
  message?: string;
}

// ── Google Auth ───────────────────────────────────────────────────────────

export interface GoogleAuthPayload {
  idToken: string;
}