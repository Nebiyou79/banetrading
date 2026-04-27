'use client';
// components/ui/AnnouncementBanner.tsx
import React from 'react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import colors from '@/styles/colors';
import type { Announcement } from '@/types';

const typeConfig = {
  info:    { bg: colors.infoBg,    border: colors.info,    text: colors.info,    icon: '📢' },
  warning: { bg: colors.warningBg, border: colors.warning, text: colors.warning, icon: '⚠️' },
  success: { bg: colors.successBg, border: colors.success, text: colors.success, icon: '✅' },
};

const AnnouncementItem: React.FC<{ item: Announcement; onDismiss: (id: string) => void }> = ({
  item, onDismiss,
}) => {
  const cfg = typeConfig[item.type] ?? typeConfig.info;
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 text-sm animate-in fade-in"
      style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.border }}
    >
      <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold" style={{ color: cfg.text }}>{item.title}: </span>
        <span style={{ color: colors.dark.textSec }}>{item.message}</span>
      </div>
      <button
        onClick={() => onDismiss(item._id)}
        className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: cfg.text }}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const AnnouncementBanner: React.FC = () => {
  const { announcements, dismiss } = useAnnouncements();
  if (!announcements.length) return null;
  return (
    <div className="space-y-2 mb-4">
      {announcements.map((a) => (
        <AnnouncementItem key={a._id} item={a} onDismiss={dismiss} />
      ))}
    </div>
  );
};

export default AnnouncementBanner;
