// services/fundsService.ts
import api from './apiClient';
import type { Deposit, Withdrawal, WithdrawRequest } from '@/types';

const fundsService = {
  async getBalance(): Promise<{ balance: number }> {
    const res = await api.get<{ balance: number }>('/funds/balance');
    return res.data;
  },

  async deposit(formData: FormData): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>('/funds/deposit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async withdraw(data: WithdrawRequest): Promise<{ message: string; updatedBalance: number }> {
    const res = await api.post<{ message: string; updatedBalance: number }>(
      '/funds/withdraw',
      data
    );
    return res.data;
  },

  async getDeposits(): Promise<Deposit[]> {
    // Returns user's deposits — uses admin endpoint but scoped by token
    const res = await api.get<Deposit[]>('/admin/deposits');
    return res.data;
  },

  async getWithdrawals(): Promise<Withdrawal[]> {
    const res = await api.get<Withdrawal[]>('/admin/withdrawals');
    return res.data;
  },
};

export default fundsService;
