'use client';
// hooks/useUser.ts

import { useState, useEffect, useCallback } from 'react';
import userService from '@/services/userService';
import { useAuthContext } from '@/context/AuthContext';
import type { User } from '@/types';

export const useUser = () => {
  const { user: authUser, setUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await userService.getProfile();
      setUser(user);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  const updateProfile = useCallback(
    async (data: { name?: string; country?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const { user } = await userService.updateProfile(data);
        setUser(user);
        return user;
      } catch (err: any) {
        setError(err.message || 'Failed to update profile');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  const changePassword = useCallback(
    async (data: { oldPassword: string; newPassword: string }) => {
      setLoading(true);
      setError(null);
      try {
        const result = await userService.changePassword(data);
        return result;
      } catch (err: any) {
        setError(err.message || 'Failed to change password');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    user: authUser,
    loading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
  };
};
