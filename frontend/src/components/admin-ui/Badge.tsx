// components/ui/Badge.tsx
// ── Status badge component ──
//
// THEME STATUS: ✅ Fully theme-aware — no changes required.
//
// All variant colors reference CSS custom properties that are defined for
// both dark and light themes in globals.css:
//   success → var(--success-muted) bg / var(--success) text
//   danger  → var(--danger-muted)  bg / var(--danger)  text
//   warning → var(--warning-muted) bg / var(--warning) text
//   info    → var(--info-muted)    bg / var(--info)    text
//   neutral → var(--hover-bg)      bg / var(--text-secondary) text
//
// Dark:  teal gain, rose loss, indigo, amber, blue — all legible on midnight bg
// Light: forest green, crimson, violet, amber, blue — all legible on plum bg

import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  danger:  { bg: 'var(--danger-muted)',  color: 'var(--danger)'  },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)'    },
  neutral: { bg: 'var(--hover-bg)',      color: 'var(--text-secondary)' },
};

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${className}`}
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {children}
    </span>
  );
}