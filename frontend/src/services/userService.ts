// services/userService.ts
import api from './apiClient';
import type { User } from '@/types';

interface UpdateProfileRequest {
  name?: string;
  country?: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

const userService = {
  async getProfile(): Promise<{ user: User }> {
    const res = await api.get<{ user: User }>('/user/profile');
    return res.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<{ message: string; user: User }> {
    const res = await api.put<{ message: string; user: User }>('/user/profile', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const res = await api.put<{ message: string }>('/user/change-password', data);
    return res.data;
  },
};

export default userService;
