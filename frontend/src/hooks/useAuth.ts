// hooks/useAuth.ts
// ── Auth hook exposing all auth methods including Google Sign-In ──

import { useAuthContext } from '@/context/AuthContext';
import type { User, LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '@/types';
export const ME_QUERY_KEY = ['me'] as const;
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginPayload) => Promise<LoginResponse>;
  register: (data: RegisterPayload) => Promise<RegisterResponse>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateBalance: (balance: number) => void;
}

export function useAuth(): UseAuthReturn {
  const ctx = useAuthContext();
  
  return {
    user: ctx.user,
    loading: ctx.loading,
    isAuthenticated: ctx.isAuthenticated,
    isAdmin: ctx.isAdmin,
    login: ctx.login,
    register: ctx.register,
    loginWithGoogle: ctx.loginWithGoogle,
    logout: ctx.logout,
    setUser: ctx.setUser,
    updateBalance: ctx.updateBalance,
  };
}