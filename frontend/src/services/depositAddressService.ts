// services/depositAddressService.ts
// ── Deposit-address book API wrappers ──

import { apiClient } from './apiClient';
import type {
  DepositAddresses,
  DepositAddressesResponse,
} from '@/types/funds';

export const depositAddressService = {
  async getAddresses(): Promise<DepositAddressesResponse> {
    const { data } = await apiClient.get<DepositAddressesResponse>('/deposit-addresses');
    return data;
  },

  async updateAddresses(partial: Partial<DepositAddresses>): Promise<DepositAddressesResponse & { message: string }> {
    const { data } = await apiClient.put<DepositAddressesResponse & { message: string }>(
      '/deposit-addresses',
      partial,
    );
    return data;
  },
};