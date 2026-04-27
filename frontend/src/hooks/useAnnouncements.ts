'use client';
// hooks/useAnnouncements.ts

import { useState, useEffect, useCallback } from 'react';
import announcementService from '@/services/announcementService';
import type { Announcement } from '@/types';

const DISMISSED_KEY = 'dismissed_announcements';

const getDismissed = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
};

export const useAnnouncements = () => {
  const [all, setAll] = useState<Announcement[]>([]);
  const [visible, setVisible] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcementService.getAnnouncements();
      setAll(data);
      const dismissed = getDismissed();
      setVisible(data.filter((a) => !dismissed.includes(a._id)));
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const dismiss = useCallback((id: string) => {
    const dismissed = getDismissed();
    if (!dismissed.includes(id)) {
      const updated = [...dismissed, id];
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
    }
    setVisible((prev) => prev.filter((a) => a._id !== id));
  }, []);

  return { announcements: visible, all, loading, error, dismiss, fetchAnnouncements };
};
