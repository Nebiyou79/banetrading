// services/promoService.ts
// ── Promo code API wrappers ──

import { apiClient } from './apiClient';
import type {
  PromoValidateResponse,
  PromoMeResponse,
  PromoGenerateResponse,
} from '../types/auth';

export const promoService = {
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
};