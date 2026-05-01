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