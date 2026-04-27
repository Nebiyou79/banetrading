// services/profileService.ts
// ── Typed wrappers for every /api/user endpoint ──

import { apiClient } from './apiClient';
import type {
  ProfilePayloadResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
  AvatarResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  Portfolio,
  RecentTransactionsResponse,
} from '@/types/profile';

export const profileService = {
  async getProfile(): Promise<ProfilePayloadResponse> {
    const { data } = await apiClient.get<ProfilePayloadResponse>('/user/profile');
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
    const { data } = await apiClient.put<UpdateProfileResponse>('/user/profile', payload);
    return data;
  },

  async uploadAvatar(file: File): Promise<AvatarResponse> {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await apiClient.post<AvatarResponse>('/user/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteAvatar(): Promise<AvatarResponse> {
    const { data } = await apiClient.delete<AvatarResponse>('/user/avatar');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    const payload: ChangePasswordPayload = { currentPassword, newPassword };
    const { data } = await apiClient.put<ChangePasswordResponse>('/user/change-password', payload);
    return data;
  },

  async getPortfolio(): Promise<Portfolio> {
    const { data } = await apiClient.get<Portfolio>('/user/portfolio');
    return data;
  },

  async getRecentTransactions(limit = 10): Promise<RecentTransactionsResponse> {
    const { data } = await apiClient.get<RecentTransactionsResponse>(
      `/user/transactions/recent?limit=${encodeURIComponent(String(limit))}`,
    );
    return data;
  },
};