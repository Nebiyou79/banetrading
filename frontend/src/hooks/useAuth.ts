// hooks/useAuth.ts
// ── React Query-based auth hook ──

import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { authService } from '../services/authService';
import { tokenStore } from '../lib/tokenStore';
import { normalizeError } from '../services/apiClient';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  User,
} from '../types/auth';

export const ME_QUERY_KEY = ['auth', 'me'] as const;

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  refetchUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient();
  const router = useRouter();

  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const { data, isFetching, isLoading, refetch } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const resp = await authService.me();
      return resp.user;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 60 * 1000,
  });

  // If the token disappears (e.g., interceptor cleared it), drop cached user.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const interval = setInterval(() => {
      if (!tokenStore.getAccess() && queryClient.getQueryData(ME_QUERY_KEY)) {
        queryClient.setQueryData(ME_QUERY_KEY, null);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => authService.login(payload),
    onSuccess: (resp) => {
      tokenStore.set(resp.accessToken, resp.refreshToken);
      queryClient.setQueryData(ME_QUERY_KEY, resp.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => authService.register(payload),
  });

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      return await loginMutation.mutateAsync(payload);
    } catch (err) {
      throw normalizeError(err);
    }
  }, [loginMutation]);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      return await registerMutation.mutateAsync(payload);
    } catch (err) {
      throw normalizeError(err);
    }
  }, [registerMutation]);

  const logout = useCallback(async () => {
    try {
      if (tokenStore.getAccess()) {
        await authService.logout().catch(() => undefined);
      }
    } finally {
      tokenStore.clear();
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
      router.push('/auth/login').catch(() => undefined);
    }
  }, [queryClient, router]);

  const refetchUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const user = (data ?? null) as User | null;

  return {
    user,
    isLoading: hasToken && (isLoading || isFetching),
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refetchUser,
  };
}