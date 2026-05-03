// services/withdrawService.ts
// ── Typed wrappers for withdrawal endpoints ──

import { apiClient } from './apiClient';
import type {
  SubmitWithdrawInput,
  SubmitWithdrawResponse,
  WithdrawalsListResponse,
} from '@/types/funds';

export const withdrawService = {
  async submitWithdraw(input: SubmitWithdrawInput): Promise<SubmitWithdrawResponse> {
    const { data } = await apiClient.post<SubmitWithdrawResponse>('/funds/withdraw', input);
    return data;
  },

  async getMyWithdrawals(limit = 20, skip = 0): Promise<WithdrawalsListResponse> {
    const { data } = await apiClient.get<WithdrawalsListResponse>(
      `/funds/withdrawals/me?limit=${limit}&skip=${skip}`,
    );
    return data;
  },
};