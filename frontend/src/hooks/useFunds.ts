'use client';
// hooks/useFunds.ts

import { useState, useEffect, useCallback } from 'react';
import fundsService from '@/services/fundsService';
import { useAuthContext } from '@/context/AuthContext';
import type { WithdrawRequest, Deposit, Withdrawal } from '@/types';

export const useFunds = () => {
  const { updateBalance } = useAuthContext();
  const [balance, setBalance] = useState<number>(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const { balance: bal } = await fundsService.getBalance();
      setBalance(bal);
      updateBalance(bal);
    } catch (err: any) {
      setError(err.message || 'Failed to load balance');
    }
  }, [updateBalance]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchBalance();
      setLoading(false);
    };
    load();
  }, [fetchBalance]);

  const deposit = useCallback(async (formData: FormData) => {
    const result = await fundsService.deposit(formData);
    return result;
  }, []);

  const withdraw = useCallback(
    async (data: WithdrawRequest) => {
      const result = await fundsService.withdraw(data);
      setBalance(result.updatedBalance);
      updateBalance(result.updatedBalance);
      return result;
    },
    [updateBalance]
  );

  return {
    balance,
    deposits,
    withdrawals,
    loading,
    error,
    fetchBalance,
    deposit,
    withdraw,
  };
};

// Separate deposit form hook
export const useDepositForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await fundsService.deposit(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Deposit submission failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = () => { setSuccess(false); setError(null); };

  return { submit, loading, error, success, reset };
};

// Separate withdraw form hook
export const useWithdrawForm = () => {
  const { updateBalance } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async (data: WithdrawRequest) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const result = await fundsService.withdraw(data);
        updateBalance(result.updatedBalance);
        setSuccess(true);
        return result;
      } catch (err: any) {
        setError(err.message || 'Withdrawal submission failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateBalance]
  );

  const reset = () => { setSuccess(false); setError(null); };

  return { submit, loading, error, success, reset };
};
