// hooks/useAdminAuth.ts
// ── Admin auth wrapper hook ──

import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';
import type { LoginPayload, User } from '@/types/auth';

interface UseAdminAuthReturn {
  adminUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const auth = useAuth();
  const router = useRouter();

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await auth.login(payload);
    // Check role after successful login
    if (response.user?.role !== 'admin') {
      await auth.logout();
      throw new Error('Access denied. Not an admin.');
    }
  }, [auth]);

  const logout = useCallback(async () => {
    await auth.logout();
    router.push('/admin/login');
  }, [auth, router]);

  return {
    adminUser: auth.user?.role === 'admin' ? auth.user : null,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated && auth.user?.role === 'admin',
    login,
    logout,
  };
}