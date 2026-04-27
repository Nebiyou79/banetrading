// services/supportService.ts
import api from './apiClient';
import type { SupportMessage, SupportConversation } from '@/types';

const supportService = {
  // ── User methods ────────────────────────────────────────────────────────
  async sendMessage(message: string, ticketId?: string): Promise<{
    message: string;
    data: SupportMessage;
    ticketId: string;
  }> {
    const res = await api.post('/support/message', { message, ticketId });
    return res.data;
  },

  async getMyMessages(): Promise<SupportMessage[]> {
    const res = await api.get<SupportMessage[]>('/support/messages');
    return res.data;
  },

  // ── Admin methods ────────────────────────────────────────────────────────
  async getAllConversations(): Promise<SupportConversation[]> {
    const res = await api.get<SupportConversation[]>('/support/admin/conversations');
    return res.data;
  },

  async getUserMessages(userId: string): Promise<SupportMessage[]> {
    const res = await api.get<SupportMessage[]>(`/support/admin/messages/${userId}`);
    return res.data;
  },

  async adminReply(userId: string, message: string, ticketId?: string): Promise<{
    message: string;
    data: SupportMessage;
  }> {
    const res = await api.post('/support/admin/reply', { userId, message, ticketId });
    return res.data;
  },

  async markAsRead(userId: string): Promise<{ message: string }> {
    const res = await api.put<{ message: string }>(`/support/admin/read/${userId}`);
    return res.data;
  },
};

export default supportService;
