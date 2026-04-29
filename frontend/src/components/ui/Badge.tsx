import React from 'react';

type Variant =
  | 'default'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'primary'
  | 'gain'
  | 'loss';

const variantClass: Record<Variant, string> = {
  default: 'bg-[var(--card)] text-[var(--text-secondary)]',
  primary: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  info: 'bg-[var(--info-bg)] text-[var(--info)]',
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  gain: 'bg-[var(--success-bg)] text-gain',
  loss: 'bg-[var(--danger-bg)] text-loss',
};

export const Badge: React.FC<{
  variant?: Variant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}> = ({ variant = 'default', children, dot, className }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${variantClass[variant]} ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
};

/* 🔥 REQUIRED shared StatusPill */
export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, Variant> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    win: 'gain',
    lose: 'loss',
    active: 'success',
    inactive: 'default',
  };

  const variant = map[status?.toLowerCase()] ?? 'default';

  return <Badge variant={variant} dot>{status}</Badge>;
};