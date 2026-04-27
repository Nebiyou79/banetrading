// services/kycService.ts
import api from './apiClient';
import type { KycStatus } from '@/types';

const kycService = {
  async getKycStatus(): Promise<KycStatus> {
    const res = await api.get<KycStatus>('/kyc/status');
    return res.data;
  },

  async submitKyc(formData: FormData): Promise<{ message: string; kyc: KycStatus }> {
    const res = await api.post<{ message: string; kyc: KycStatus }>('/kyc/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default kycService;
