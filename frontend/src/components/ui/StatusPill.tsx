// components/ui/StatusPill.tsx
// ── Single shared status pill — used across KYC, deposits, withdrawals, etc. ──

import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type StatusPillTone =
  | 'success'      // approved / verified / won
  | 'warning'      // pending / coming-soon
  | 'danger'       // rejected / failed / lost
  | 'neutral'      // not_submitted / cancelled / unknown
  | 'info'         // informational
  | 'accent';      // highlighted

export interface StatusPillProps {
  tone: StatusPillTone;
  children: ReactNode;
  size?: 'xs' | 'sm';
  leadingIcon?: ReactNode;
  className?: string;
}

const TONE: Record<StatusPillTone, string> = {
  // 1px solid border + muted bg + foreground color, per Doc 4 spec.
  success: 'bg-success-muted text-success border-success/60',
  warning: 'bg-warning-muted text-warning border-warning/60',
  danger:  'bg-danger-muted text-danger border-danger/60',
  info:    'bg-info-muted text-info border-info/60',
  accent:  'bg-accent-muted text-accent border-accent/60',
  neutral: 'bg-muted text-text-secondary border-border',
};

const SIZE: Record<NonNullable<StatusPillProps['size']>, string> = {
  xs: 'h-5 px-2 text-[10px]',
  sm: 'h-6 px-3 text-xs',
};

/**
 * Single source of truth for status pills across the app.
 * Always: rounded-full, 1px solid border, semibold, uppercase tracking-wider.
 */
export function StatusPill({
  tone,
  size = 'sm',
  leadingIcon,
  children,
  className,
}: StatusPillProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider whitespace-nowrap',
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

// ── KYC-specific helper that maps status enum → tone + label ──
import type { KycStatusValue } from '@/types/kyc';

const KYC_TONE: Record<KycStatusValue, StatusPillTone> = {
  approved:      'success',
  pending:       'warning',
  rejected:      'danger',
  not_submitted: 'neutral',
};

const KYC_LABEL: Record<KycStatusValue, string> = {
  approved:      'Verified',
  pending:       'Pending',
  rejected:      'Rejected',
  not_submitted: 'Not Started',
};

export function KycStatusPill({ status, size = 'sm' }: { status: KycStatusValue; size?: 'xs' | 'sm' }): JSX.Element {
  return <StatusPill tone={KYC_TONE[status]} size={size}>{KYC_LABEL[status]}</StatusPill>;
}