'use client';

import React from 'react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useResponsive } from '@/hooks/useResponsive';
import type { Announcement } from '@/types';

const typeStyles = {
  info: {
    bg: 'var(--info-bg)',
    border: 'var(--info)',
    text: 'var(--info)',
    icon: '📢',
  },
  warning: {
    bg: 'var(--warning-bg)',
    border: 'var(--warning)',
    text: 'var(--warning)',
    icon: '⚠️',
  },
  success: {
    bg: 'var(--success-bg)',
    border: 'var(--success)',
    text: 'var(--success)',
    icon: '✅',
  },
};

const AnnouncementItem: React.FC<{
  item: Announcement;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const cfg = typeStyles[item.type] ?? typeStyles.info;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-card border-l-4 text-sm animate-in fade-in"
      style={{
        backgroundColor: cfg.bg,
        borderLeftColor: cfg.border,
      }}
    >
      <span className="text-base shrink-0 mt-0.5">{cfg.icon}</span>

      <div className="flex-1 min-w-0">
        <span className="font-semibold" style={{ color: cfg.text }}>
          {item.title}:{' '}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {item.message}
        </span>
      </div>

      <button
        onClick={() => onDismiss(item._id)}
        className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: cfg.text }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
};

export const AnnouncementBanner: React.FC = () => {
  const { announcements, dismiss } = useAnnouncements();
  const { isMobile } = useResponsive();

  if (!announcements.length) return null;

  return (
    <div className={`${isMobile ? 'space-y-2' : 'space-y-3'} mb-4`}>
      {announcements.map((a) => (
        <AnnouncementItem key={a._id} item={a} onDismiss={dismiss} />
      ))}
    </div>
  );
};

export default AnnouncementBanner;