// services/authService.ts
// ── Typed wrappers for every /api/auth endpoint ──

import { apiClient } from './apiClient';
import type {
  RegisterPayload,
  RegisterResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  ResendOtpPayload,
  MessageResponse,
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  VerifyResetOtpPayload,
  VerifyResetOtpResponse,
  ResetPasswordPayload,
  RefreshPayload,
  RefreshResponse,
  ProfileResponse,
} from '../types/auth';

export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    const { data } = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', payload);
    return data;
  },

  async resendOtp(payload: ResendOtpPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/resend-otp', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', payload);
    return data;
  },

  async verifyResetOtp(payload: VerifyResetOtpPayload): Promise<VerifyResetOtpResponse> {
    const { data } = await apiClient.post<VerifyResetOtpResponse>('/auth/verify-reset-otp', payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', payload);
    return data;
  },

  async refresh(payload: RefreshPayload): Promise<RefreshResponse> {
    const { data } = await apiClient.post<RefreshResponse>('/auth/refresh', payload);
    return data;
  },

  async logout(): Promise<MessageResponse> {
    const { data } = await apiClient.post<MessageResponse>('/auth/logout', {});
    return data;
  },

  async me(): Promise<ProfileResponse> {
    const { data } = await apiClient.get<ProfileResponse>('/user/profile');
    return data;
  },
};