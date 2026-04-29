// services/networkFeeService.ts
// ── Network fee API wrappers ──

import { apiClient } from './apiClient';
import type {
  NetworkFeesResponse,
  UpdateFeeResponse,
  WithdrawNetwork,
} from '@/types/funds';

export const networkFeeService = {
  async getAllFees(): Promise<NetworkFeesResponse> {
    const { data } = await apiClient.get<NetworkFeesResponse>('/fees');
    return data;
  },

  async updateFee(network: WithdrawNetwork, fee: number): Promise<UpdateFeeResponse> {
    const { data } = await apiClient.put<UpdateFeeResponse>(
      `/fees/${encodeURIComponent(network)}`,
      { fee },
    );
    return data;
  },
};