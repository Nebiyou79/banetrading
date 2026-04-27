// services/announcementService.ts
import api from './apiClient';
import type { Announcement } from '@/types';

const announcementService = {
  async getAnnouncements(): Promise<Announcement[]> {
    const res = await api.get<Announcement[]>('/announcements');
    return res.data;
  },

  async createAnnouncement(data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    expiresAt?: string;
  }): Promise<{ message: string; announcement: Announcement }> {
    const res = await api.post<{ message: string; announcement: Announcement }>(
      '/admin/announcements',
      data
    );
    return res.data;
  },

  async deleteAnnouncement(id: string): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>(`/admin/announcements/${id}`);
    return res.data;
  },
};

export default announcementService;
