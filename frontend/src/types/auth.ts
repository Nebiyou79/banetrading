// types/auth.ts
// ── Auth types shared across services, hooks, and UI ──

export type UserRole = 'user' | 'admin';
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type OtpPurpose = 'email_verification' | 'password_reset';

export interface User {
  _id: string;                  // ← MUST EXIST
  name: string;
  email: string;
  country?: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  isFrozen: boolean;
  freezeReason?: string;
  kycTier: number;
  kycStatus: KycStatus;
  autoMode: boolean | string;   // Can be boolean or string enum
  balance?: number;             // Legacy balance field
  balances?: Record<string, number>; // Multi-currency balances
  promoCodeUsed?: string;
  ownPromoCode?: string;
  referralCount: number;
  bonusUnlocked: boolean;
  bonusCreditedAt?: string;
  passwordUpdatedAt?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Request payloads ──
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  country?: string;
  promoCode?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface ResendOtpPayload {
  email: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

// ── Response shapes ──
export interface MessageResponse {
  message: string;
}

export interface RegisterResponse extends MessageResponse {
  email: string;
}

export interface VerifyOtpResponse extends MessageResponse {
  resetToken?: string;
}

export interface VerifyResetOtpResponse extends MessageResponse {
  resetToken: string;
}

export interface LoginResponse extends MessageResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResponse {
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Array<{ path: string; message: string }>;
}

// ── Promo ──
export interface PromoValidateResponse {
  valid: boolean;
  reason?: string;
  code?: string;
}

export interface PromoMeResponse {
  ownPromoCode: string | null;
  referralCount: number;
  bonusUnlocked: boolean;
  bonusThreshold: number;
  usageCount: number;
  isActive: boolean | null;
}

export interface PromoGenerateResponse {
  code: string;
  usageCount: number;
  bonusThreshold: number;
  isActive: boolean;
}