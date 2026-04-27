'use client';
// context/AuthContext.tsx
// Access token lives in memory. Refresh token in localStorage.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { tokenStore } from '@/services/api';
import authService from '@/services/authService';
import type { User, LoginRequest } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
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
        const { accessToken } = await authService.refreshToken(storedRefreshToken);
        tokenStore.setAccessToken(accessToken);
        // Fetch profile with the fresh access token
        const { getUserProfile } = await import('@/services/userService').then(m => m.default);
        // getUserService not imported to avoid circular — inline fetch
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        tokenStore.clearAll();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    tokenStore.setAccessToken(response.accessToken);
    tokenStore.setRefreshToken(response.refreshToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Always clear tokens even if the request fails
    } finally {
      tokenStore.clearAll();
      setUser(null);
    }
  }, []);

  const updateBalance = useCallback((balance: number) => {
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
