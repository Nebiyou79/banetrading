// services/kycService.ts
// ── KYC API wrappers ──

import { apiClient } from './apiClient';
import type {
  KycStatusResponse,
  KycSubmitLevel2Input,
  KycSubmitLevel2Response,
  KycSubmitLevel3Input,
  KycSubmitLevel3Response,
} from '@/types/kyc';

export const kycService = {
  async getStatus(): Promise<KycStatusResponse> {
    const { data } = await apiClient.get<KycStatusResponse>('/kyc/status');
    return data;
  },

  async submitLevel2(input: KycSubmitLevel2Input): Promise<KycSubmitLevel2Response> {
    const form = new FormData();
    form.append('fullName',     input.fullName);
    form.append('dateOfBirth',  input.dateOfBirth);
    form.append('country',      input.country);
    form.append('idType',       input.idType);
    form.append('idNumber',     input.idNumber);
    if (input.expiryDate) form.append('expiryDate', input.expiryDate);
    form.append('idFront', input.idFront);
    if (input.idBack) form.append('idBack', input.idBack);
    if (input.selfie) form.append('selfie', input.selfie);

    const { data } = await apiClient.post<KycSubmitLevel2Response>('/kyc/level2', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async submitLevel3(input: KycSubmitLevel3Input): Promise<KycSubmitLevel3Response> {
    const form = new FormData();
    form.append('fullName',    input.fullName);
    form.append('addressLine', input.addressLine);
    form.append('city',        input.city);
    form.append('postalCode',  input.postalCode);
    form.append('country',     input.country);
    form.append('document',    input.document);

    const { data } = await apiClient.post<KycSubmitLevel3Response>('/kyc/level3', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};