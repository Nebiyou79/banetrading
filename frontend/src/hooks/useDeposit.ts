'use client';
// hooks/useDeposit.ts

import { useState, useEffect, useCallback } from 'react';
import depositService from '@/services/depositService';
import type { DepositAddresses } from '@/types';

export const useDeposit = () => {
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await depositService.getDepositAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load deposit addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return { addresses, loading, error, fetchAddresses };
};
