// components/ui/Badge.tsx
// ── Status badge component ──

import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  danger: { bg: 'var(--danger-muted)', color: 'var(--danger)' },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
  info: { bg: 'var(--info-muted)', color: 'var(--info)' },
  neutral: { bg: 'var(--hover-bg)', color: 'var(--text-secondary)' },
};

export default function Badge({ variant = 'neutral', children }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {children}
    </span>
  );
}