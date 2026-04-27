// components/ui/Pill.tsx
// ── Small colored pill / status badge ──

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PillTone = 'neutral' | 'accent' | 'success' | 'danger' | 'info' | 'warning';

export interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  size?: 'xs' | 'sm';
  leadingIcon?: ReactNode;
  className?: string;
}

const TONE: Record<PillTone, string> = {
  neutral: 'bg-muted text-text-secondary border-border',
  accent:  'bg-accent/10 text-accent border-accent/30',
  success: 'bg-success/10 text-success border-success/30',
  danger:  'bg-danger/10 text-danger border-danger/30',
  info:    'bg-info/10 text-info border-info/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
};

const SIZE: Record<NonNullable<PillProps['size']>, string> = {
  xs: 'h-5 px-2 text-[10px]',
  sm: 'h-6 px-2.5 text-xs',
};

export function Pill({ tone = 'neutral', size = 'sm', leadingIcon, className, children }: PillProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium uppercase tracking-wider',
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {leadingIcon && <span className="inline-flex">{leadingIcon}</span>}
      <span>{children}</span>
    </span>
  );
}