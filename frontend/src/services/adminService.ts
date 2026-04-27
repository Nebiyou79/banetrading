// services/adminService.ts
import api from './apiClient';
import type { AdminStats, User, Deposit, Withdrawal, Trade } from '@/types';

const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    const res = await api.get<AdminStats>('/admin/stats');
    return res.data;
  },

  // ── Users ────────────────────────────────────────────────────────────────
  async getAllUsers(): Promise<User[]> {
    const res = await api.get<User[]>('/admin/users');
    return res.data;
  },

  async getUserById(id: string): Promise<User> {
    const res = await api.get<User>(`/admin/users/${id}`);
    return res.data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<{ message: string; user: User }> {
    const res = await api.put<{ message: string; user: User }>(`/admin/users/${id}`, data);
    return res.data;
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>(`/admin/users/${id}`);
    return res.data;
  },

  // ── Deposits ─────────────────────────────────────────────────────────────
  async getAllDeposits(status?: string): Promise<Deposit[]> {
    const res = await api.get<Deposit[]>('/admin/deposits', { params: { status } });
    return res.data;
  },

  async getPendingDeposits(): Promise<Deposit[]> {
    const res = await api.get<Deposit[]>('/admin/deposits/pending');
    return res.data;
  },

  async approveDeposit(depositId: string): Promise<{
    message: string;
    deposit: Deposit;
    updatedBalance: number;
  }> {
    const res = await api.put(`/admin/deposits/${depositId}/approve`);
    return res.data;
  },

  async rejectDeposit(depositId: string, rejectionReason: string): Promise<{
    message: string;
    deposit: Deposit;
  }> {
    const res = await api.put(`/admin/deposits/${depositId}/reject`, { rejectionReason });
    return res.data;
  },

  // ── Withdrawals ───────────────────────────────────────────────────────────
  async getAllWithdrawals(status?: string): Promise<Withdrawal[]> {
    const res = await api.get<Withdrawal[]>('/admin/withdrawals', { params: { status } });
    return res.data;
  },

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    const res = await api.get<Withdrawal[]>('/admin/withdrawals/pending');
    return res.data;
  },

  async approveWithdrawal(withdrawalId: string): Promise<{
    message: string;
    withdrawal: Withdrawal;
    updatedBalance: number;
  }> {
    const res = await api.put(`/admin/withdrawals/${withdrawalId}/approve`);
    return res.data;
  },

  async rejectWithdrawal(withdrawalId: string, rejectionReason: string): Promise<{
    message: string;
    withdrawal: Withdrawal;
  }> {
    const res = await api.put(`/admin/withdrawals/${withdrawalId}/reject`, { rejectionReason });
    return res.data;
  },

  // ── KYC ──────────────────────────────────────────────────────────────────
  async getAllKycRequests(): Promise<any[]> {
    const res = await api.get('/admin/kyc');
    return res.data;
  },

  async approveKyc(userId: string): Promise<{ message: string }> {
    const res = await api.put(`/admin/kyc/${userId}/approve`);
    return res.data;
  },

  async rejectKyc(userId: string, rejectionReason: string): Promise<{ message: string }> {
    const res = await api.put(`/admin/kyc/${userId}/reject`, { rejectionReason });
    return res.data;
  },

  // ── Trades ────────────────────────────────────────────────────────────────
  async getAllTrades(): Promise<Trade[]> {
    const res = await api.get<Trade[]>('/admin/trades');
    return res.data;
  },
};

export default adminService;
