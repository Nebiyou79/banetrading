// components/ui/StatusPill.tsx
// ── Single shared status pill — used across KYC, deposits, withdrawals, tickets, etc. ──

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
  success: 'bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]/60',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/60',
  danger:  'bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger)]/60',
  info:    'bg-[var(--info-muted)] text-[var(--info)] border-[var(--info)]/60',
  accent:  'bg-[var(--primary-muted)] text-[var(--accent)] border-[var(--accent)]/60',
  neutral: 'bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border)]',
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

// ── Status string mapping helpers ──

/** Maps common status strings to StatusPill tone + label */
export type StatusString = 
  | 'approved' | 'pending' | 'rejected' | 'completed' | 'failed'
  | 'open' | 'in_progress' | 'resolved' | 'closed'
  | 'active' | 'inactive';

const STATUS_MAP: Record<string, { tone: StatusPillTone; label: string }> = {
  // ── Deposit / Withdrawal statuses ──
  approved:      { tone: 'success', label: 'Approved' },
  pending:       { tone: 'warning', label: 'Pending' },
  rejected:      { tone: 'danger',  label: 'Rejected' },

  // ── Trade / Conversion statuses ──
  completed:     { tone: 'success', label: 'Completed' },
  failed:        { tone: 'danger',  label: 'Failed' },

  // ── Ticket statuses ──
  open:          { tone: 'info',    label: 'Open' },
  in_progress:   { tone: 'warning', label: 'In Progress' },
  resolved:      { tone: 'success', label: 'Resolved' },
  closed:        { tone: 'neutral', label: 'Closed' },

  // ── General ──
  active:        { tone: 'success', label: 'Active' },
  inactive:      { tone: 'neutral', label: 'Inactive' },
};

export interface StatusFromStringProps {
  status: string;
  size?: 'xs' | 'sm';
  className?: string;
}

/**
 * Convenience component that accepts a status string directly
 * and maps it to the correct tone + label automatically.
 * 
 * Usage: <StatusPillFromString status="approved" />
 *        <StatusPillFromString status="pending" />
 *        <StatusPillFromString status="open" />
 */
export function StatusPillFromString({ status, size = 'sm', className }: StatusFromStringProps): JSX.Element {
  const mapped = STATUS_MAP[status] || { tone: 'neutral' as StatusPillTone, label: status };
  return (
    <StatusPill tone={mapped.tone} size={size} className={className}>
      {mapped.label}
    </StatusPill>
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