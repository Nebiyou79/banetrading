'use client';
// context/AuthContext.tsx
// Access token lives in memory. Refresh token in localStorage.
// Added Google Sign-In support alongside existing email/password login.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { tokenStore } from '@/lib/tokenStore';
import { authService } from '@/services/authService';
import { googleAuthService } from '@/services/googleAuthService';
import type { User, LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '@/types';

interface AuthContextValue {
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

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  // On mount: attempt silent token refresh from stored refresh token
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const bootstrap = async () => {
      const storedRefreshToken = tokenStore.getRefreshToken();
      if (!storedRefreshToken) {
        setLoading(false);
        return;
      }
      try {
        const { accessToken } = await authService.refresh({ refreshToken: storedRefreshToken });
        tokenStore.setAccessToken(accessToken);
        // Fetch profile with the fresh access token
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('[Auth] Bootstrap failed:', error);
        tokenStore.clearAll();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // ── Email/Password Login (returns LoginResponse for admin role check) ──
  const login = useCallback(async (data: LoginPayload): Promise<LoginResponse> => {
    const response = await authService.login(data);
    tokenStore.setAccessToken(response.accessToken);
    tokenStore.setRefreshToken(response.refreshToken);
    setUser(response.user);
    return response;
  }, []);

  // ── Email/Password Registration ──
  const register = useCallback(async (data: RegisterPayload): Promise<RegisterResponse> => {
    const response = await authService.register(data);
    // Registration doesn't return tokens - user needs to verify email first
    return response;
  }, []);

  // ── Google Sign-In ──
  const loginWithGoogle = useCallback(async (idToken: string): Promise<void> => {
    const response = await googleAuthService.googleSignIn({ idToken });
    tokenStore.setAccessToken(response.accessToken);
    tokenStore.setRefreshToken(response.refreshToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      // Always clear tokens even if the request fails
      console.error('[Auth] Logout error:', error);
    } finally {
      tokenStore.clearAll();
      setUser(null);
    }
  }, []);

  const updateBalance = useCallback((balance: number): void => {
    setUser((prev) => (prev ? { ...prev, balance } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginWithGoogle,
        logout,
        setUser,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;