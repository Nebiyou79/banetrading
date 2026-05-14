// services/adminService.ts
// ── Admin API service with proper file URL handling ──

import { apiClient } from './apiClient';
import type { AdminStats, User, Deposit, Withdrawal, Trade } from '@/types';
import type { ConversionConfig } from '@/types/convert';
import type { SupportTicket, TicketMessage, SupportConfig } from '@/types/support';

// Helper function to get full file URL
function getFullFileUrl(path: string | undefined): string | null {
  if (!path) return null;
  // If it's already an absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Get base URL from environment or window location
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                  (typeof window !== 'undefined' ? window.location.origin : 'https://bigonetrading.com');
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// KycSubmission interface with file URLs
interface KycSubmission {
  _id: string;
  userId: { _id: string; email: string; name?: string; kycTier: number };
  level2: {
    status: string;
    fullName?: string;
    dateOfBirth?: string;
    country?: string;
    idType?: string;
    idNumber?: string;
    expiryDate?: string;
    idFrontPath?: string;
    idFrontUrl?: string;
    idBackPath?: string;
    idBackUrl?: string;
    selfiePath?: string;
    selfieUrl?: string;
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  level3: {
    status: string;
    fullName?: string;
    addressLine?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    documentPath?: string;
    documentUrl?: string;
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  updatedAt: string;
}

// Extended Deposit interface with file URL
interface ExtendedDeposit extends Deposit {
  proofFileUrl?: string | null;
}

const adminService = {
  // ── Dashboard Stats ─────────────────────────────────────────────────────
  async getStats(): Promise<AdminStats> {
    const { data } = await apiClient.get<AdminStats>('/admin/stats');
    return data;
  },

  // ── Users ────────────────────────────────────────────────────────────────
  async fetchUsers(params?: {
    search?: string;
    sortBy?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const { data } = await apiClient.get<{ users: User[]; total: number }>('/admin/users', { params });
    return data;
  },

  async updateUser(id: string, payload: Partial<User>): Promise<{ message: string; user: User }> {
    const { data } = await apiClient.patch<{ message: string; user: User }>(`/admin/users/${id}`, payload);
    return data;
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/admin/users/${id}`);
    return data;
  },

  // ── Deposits with File URLs ─────────────────────────────────────────────
  async fetchDeposits(params?: {
    status?: string;
    search?: string;
    currency?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ deposits: ExtendedDeposit[]; total: number }> {
    const { data } = await apiClient.get<{ deposits: Deposit[]; total: number }>('/admin/deposits', { params });
    
    // Add full file URLs to each deposit
    const depositsWithUrls = (data.deposits || []).map((deposit: Deposit) => ({
      ...deposit,
      proofFileUrl: getFullFileUrl(deposit.proofFilePath),
    }));
    
    return { deposits: depositsWithUrls, total: data.total };
  },

  async approveDeposit(id: string): Promise<{ message: string; deposit: Deposit; newBalances: any }> {
    const { data } = await apiClient.post(`/admin/deposits/${id}/approve`);
    return data;
  },

  async rejectDeposit(id: string, reason: string): Promise<{ message: string; deposit: Deposit }> {
    const { data } = await apiClient.post(`/admin/deposits/${id}/reject`, { reason });
    return data;
  },

  // ── Withdrawals ──────────────────────────────────────────────────────────
  async fetchWithdrawals(params?: {
    status?: string;
    search?: string;
    currency?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ withdrawals: Withdrawal[]; total: number }> {
    const { data } = await apiClient.get<{ withdrawals: Withdrawal[]; total: number }>('/admin/withdrawals', { params });
    return data;
  },

  async approveWithdrawal(id: string): Promise<{ message: string; withdrawal: Withdrawal }> {
    const { data } = await apiClient.post(`/admin/withdrawals/${id}/approve`);
    return data;
  },

  async rejectWithdrawal(id: string, reason: string): Promise<{ message: string; withdrawal: Withdrawal }> {
    const { data } = await apiClient.post(`/admin/withdrawals/${id}/reject`, { reason });
    return data;
  },

  // ── KYC with File URLs ──────────────────────────────────────────────────
  async fetchKycList(params?: {
    search?: string;
    level?: number;
    skip?: number;
    limit?: number;
  }): Promise<{ items: KycSubmission[]; total: number }> {
    const { data } = await apiClient.get<{ items: KycSubmission[]; total: number }>('/kyc/admin/pending', { params });
    
    // Add full file URLs to each KYC submission
    const itemsWithUrls = (data.items || []).map((item: KycSubmission) => {
      // Process level 2 files
      if (item.level2) {
        if (item.level2.idFrontPath) {
          item.level2.idFrontUrl = getFullFileUrl(item.level2.idFrontPath) || undefined;
        }
        if (item.level2.idBackPath) {
          item.level2.idBackUrl = getFullFileUrl(item.level2.idBackPath) || undefined;
        }
        if (item.level2.selfiePath) {
          item.level2.selfieUrl = getFullFileUrl(item.level2.selfiePath) || undefined;
        }
      }
      
      // Process level 3 files
      if (item.level3 && item.level3.documentPath) {
        item.level3.documentUrl = getFullFileUrl(item.level3.documentPath) || undefined;
      }
      
      return item;
    });
    
    return { items: itemsWithUrls, total: data.total };
  },

  async approveKyc(userId: string, level: number): Promise<{ message: string }> {
    const { data } = await apiClient.patch(`/kyc/admin/${userId}/level/${level}/approve`);
    return data;
  },

  async rejectKyc(userId: string, level: number, reason: string): Promise<{ message: string }> {
    const { data } = await apiClient.patch(`/kyc/admin/${userId}/level/${level}/reject`, { reason });
    return data;
  },

  // ── Trades ───────────────────────────────────────────────────────────────
  async fetchAllTrades(params?: {
    userId?: string;
    status?: string;
    planKey?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ trades: Trade[]; total: number }> {
    const { data } = await apiClient.get<{ trades: Trade[]; total: number }>('/trade/admin/all', { params });
    return data;
  },

  // ── Support Tickets ──────────────────────────────────────────────────────
  async fetchTickets(params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{ tickets: SupportTicket[] }> {
    const { data } = await apiClient.get<{ tickets: SupportTicket[] }>('/support/admin/tickets', { params });
    return data;
  },

  async getTicket(id: string): Promise<{ ticket: SupportTicket; messages: TicketMessage[] }> {
    const { data } = await apiClient.get<{ ticket: SupportTicket; messages: TicketMessage[] }>(`/support/tickets/${id}`);
    return data;
  },

  async sendMessage(ticketId: string, body: string): Promise<{ message: TicketMessage }> {
    const { data } = await apiClient.post<{ message: TicketMessage }>(`/support/admin/tickets/${ticketId}/messages`, { body });
    return data;
  },

  async updateTicket(id: string, payload: { status?: string; category?: string; assignedTo?: string | null }): Promise<{ ticket: SupportTicket }> {
    const { data } = await apiClient.patch<{ ticket: SupportTicket }>(`/support/admin/tickets/${id}`, payload);
    return data;
  },

  async markTicketRead(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post<{ success: boolean }>(`/support/admin/tickets/${id}/read`);
    return data;
  },

  // ── Support Config ───────────────────────────────────────────────────────
  async getSupportConfig(): Promise<{ config: SupportConfig }> {
    const { data } = await apiClient.get<{ config: SupportConfig }>('/support/admin/config');
    return data;
  },

  async updateSupportConfig(payload: Partial<SupportConfig>): Promise<{ config: SupportConfig }> {
    const { data } = await apiClient.put<{ config: SupportConfig }>('/support/admin/config', payload);
    return data;
  },

  // ── Conversion Config (admin) ────────────────────────────────────────────
  async getConversionConfig(): Promise<{ config: ConversionConfig }> {
    const { data } = await apiClient.get<{ config: ConversionConfig }>('/convert/admin/config');
    return data;
  },

  async updateConversionConfig(payload: {
    feeBps?: number;
    minConvertUsd?: number;
    enabledPairs?: string[];
  }): Promise<{ config: ConversionConfig }> {
    const { data } = await apiClient.put<{ config: ConversionConfig }>('/convert/admin/config', payload);
    return data;
  },
};

export default adminService;