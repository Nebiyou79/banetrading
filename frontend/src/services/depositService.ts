// services/depositService.ts
import api from './apiClient';
import type { DepositAddresses } from '@/types';

const depositService = {
  async getDepositAddresses(): Promise<DepositAddresses> {
    const res = await api.get<DepositAddresses>('/deposit/addresses');
    return res.data;
  },

  async updateDepositAddresses(
    data: Partial<DepositAddresses>
  ): Promise<{ message: string; addresses: DepositAddresses }> {
    const res = await api.put<{ message: string; addresses: DepositAddresses }>(
      '/deposit/addresses',
      data
    );
    return res.data;
  },
};

export default depositService;
