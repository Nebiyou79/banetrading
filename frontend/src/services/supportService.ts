// services/supportService.ts
// ── SUPPORT API SERVICE ──

import { apiClient } from './apiClient';
import type {
  Ticket,
  TicketMessage,
  TicketDetailResponse,
  SupportConfig,
} from '@/types/support';

export const supportService = {
  // ── Public ──
  getConfig: async (): Promise<SupportConfig> => {
    const { data } = await apiClient.get<SupportConfig>('/support/config');
    return data;
  },

  // ── User endpoints ──
  listTickets: async (): Promise<{ tickets: Ticket[] }> => {
    const { data } = await apiClient.get<{ tickets: Ticket[] }>('/support/tickets');
    return data;
  },

  createTicket: async (formData: FormData): Promise<{ ticket: Ticket; messages: TicketMessage[] }> => {
    const { data } = await apiClient.post<{ ticket: Ticket; messages: TicketMessage[] }>(
      '/support/tickets',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  getTicket: async (id: string): Promise<TicketDetailResponse> => {
    const { data } = await apiClient.get<TicketDetailResponse>(`/support/tickets/${id}`);
    return data;
  },

  sendMessage: async (id: string, formData: FormData): Promise<{ message: TicketMessage }> => {
    const { data } = await apiClient.post<{ message: TicketMessage }>(
      `/support/tickets/${id}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  markRead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(`/support/tickets/${id}/read`);
    return data;
  },

  closeTicket: async (id: string): Promise<{ ticket: Ticket }> => {
    const { data } = await apiClient.post<{ ticket: Ticket }>(`/support/tickets/${id}/close`);
    return data;
  },

  // ── Admin endpoints ──
  adminListTickets: async (params?: { status?: string; category?: string; search?: string }): Promise<{ tickets: Ticket[] }> => {
    const { data } = await apiClient.get<{ tickets: Ticket[] }>('/support/admin/tickets', { params });
    return data;
  },

  adminSendMessage: async (id: string, formData: FormData): Promise<{ message: TicketMessage }> => {
    const { data } = await apiClient.post<{ message: TicketMessage }>(
      `/support/admin/tickets/${id}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  adminMarkRead: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(`/support/admin/tickets/${id}/read`);
    return data;
  },

  adminUpdateTicket: async (id: string, payload: { status?: string; category?: string; assignedTo?: string }): Promise<{ ticket: Ticket }> => {
    const { data } = await apiClient.patch<{ ticket: Ticket }>(`/support/admin/tickets/${id}`, payload);
    return data;
  },

  adminGetConfig: async (): Promise<{ config: SupportConfig & { emailContact?: string; updatedBy?: string } }> => {
    const { data } = await apiClient.get<{ config: SupportConfig & { emailContact?: string; updatedBy?: string } }>('/support/admin/config');
    return data;
  },

  adminUpdateConfig: async (payload: Record<string, unknown>): Promise<{ config: SupportConfig }> => {
    const { data } = await apiClient.put<{ config: SupportConfig }>('/support/admin/config', payload);
    return data;
  },
};