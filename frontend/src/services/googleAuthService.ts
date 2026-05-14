// services/googleAuthService.ts
// ── Google OAuth service for frontend ──

import { apiClient } from './apiClient';
import type { LoginResponse, GoogleAuthPayload } from '../types/auth';

export const googleAuthService = {
  /**
   * Exchange Google ID token for backend JWT tokens
   */
  async googleSignIn(payload: GoogleAuthPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/google', payload);
    return data;
  },
};