// services/promoService.ts
// ── Promo code API wrappers (extended with Module 8) ──

import { apiClient } from './apiClient';
import type {
  PromoValidateResponse,
  PromoMeResponse,
  PromoGenerateResponse,
} from '../types/auth';
import type { PromoStats, LeaderboardEntry, MyReferral } from '../types/promo';

export const promoService = {
  // ── Existing (Module 1) ──
  async validatePromo(code: string): Promise<PromoValidateResponse> {
    const normalized = code.trim().toUpperCase();
    const { data } = await apiClient.get<PromoValidateResponse>(
      `/promo/validate/${encodeURIComponent(normalized)}`,
      { headers: { Authorization: '' } },
    );
    return data;
  },

  async getMyPromo(): Promise<PromoMeResponse> {
    const { data } = await apiClient.get<PromoMeResponse>('/promo/me');
    return data;
  },

  async generateMyPromo(): Promise<PromoGenerateResponse> {
    const { data } = await apiClient.post<PromoGenerateResponse>('/promo/generate', {});
    return data;
  },

  // ── Module 8: Extended promo stats ──
  async getMe(): Promise<PromoStats> {
    const { data } = await apiClient.get<PromoStats>('/promo/me');
    return data;
  },

  // ── Module 8: Generate code (returns same as getMe for consistency) ──
  async generateCode(): Promise<{ code: string }> {
    const { data } = await apiClient.post<{ code: string }>('/promo/generate', {});
    return data;
  },

  // ── Module 8: Leaderboard ──
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const { data } = await apiClient.get<{ leaderboard: LeaderboardEntry[] }>(
      '/promo/leaderboard',
    );
    return data;
  },

  // ── Module 8: My referrals ──
  async getMyReferrals(limit = 20): Promise<{ referrals: MyReferral[] }> {
    const { data } = await apiClient.get<{ referrals: MyReferral[] }>(
      '/promo/my-referrals',
      { params: { limit } },
    );
    return data;
  },
};