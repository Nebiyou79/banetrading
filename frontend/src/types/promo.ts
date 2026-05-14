// types/promo.ts
// ── PROMO MODULE TYPES (EXTENDED) ──

export interface PromoStats {
  code: string | null;
  hasCode: boolean;
  isActive: boolean;
  usageCount: number;
  signupCount: number;
  depositorCount: number;
  signupBonusGranted: boolean;
  signupBonusGrantedAt?: string;
  depositBonusGranted: boolean;
  depositBonusGrantedAt?: string;
  signupThreshold: number;
  depositThreshold: number;
  signupBonusUsd: number;
  depositBonusUsd: number;
  totalBonusEarnedUsd: number;
}

export interface LeaderboardEntry {
  rank: number;
  codeMasked: string;
  signupCount: number;
  depositorCount: number;
  isCurrentUser: boolean;
}

export interface MyReferral {
  initials: string;
  signedUpAt: string;
  hasDeposited: boolean;
}

// ── Promo Types ─────────────────────────────────────────────────────────────

export interface PromoValidateResponse {
  reason?: "format" | "not_found" | "inactive";
  code?: boolean;
  valid: boolean;
  message?: string;
  data?: {
    code?: string;
    ownerId: string;
    usageCount: number;
    isValid: boolean;
  };
}

export interface PromoMeResponse {
  code: string | null;
  hasCode: boolean;
  referralCount: number;
  bonusUnlocked: boolean;
  bonusCreditedAt?: string;
  totalBonusEarnedUsd: number;
  signupCount: number;
  depositorCount: number;
  signupThreshold: number;
  depositThreshold: number;
  signupBonusUsd: number;
  depositBonusUsd: number;
  signupBonusGranted: boolean;
  depositBonusGranted: boolean;
  signupBonusGrantedAt?: string;
  depositBonusGrantedAt?: string;
}

export interface PromoGenerateResponse {
  message: string;
  code: string;
}