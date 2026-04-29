// components/ui/Pill.tsx

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PillTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'danger'
  | 'info'
  | 'warning';

export interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  size?: 'xs' | 'sm';
  leadingIcon?: ReactNode;
  className?: string;
}

const TONE = {
  neutral: 'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]',
  info: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]',
};

const SIZE = {
  xs: 'h-5 px-2 text-[10px]',
  sm: 'h-6 px-2.5 text-xs',
};

export function Pill({
  tone = 'neutral',
  size = 'sm',
  leadingIcon,
  className,
  children,
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wide',
        TONE[tone],
        SIZE[size],
        className
      )}
    >
      {leadingIcon && <span>{leadingIcon}</span>}
      {children}
    </span>
  );
}