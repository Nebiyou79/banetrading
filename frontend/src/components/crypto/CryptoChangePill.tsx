// components/crypto/CryptoChangePill.tsx
// ── 24H CHANGE PILL — Professional gain/loss indicator ──

import React from 'react';
import clsx from 'clsx';

interface CryptoChangePillProps {
  value: number | null;
  className?: string;
}

export default function CryptoChangePill({ value, className = '' }: CryptoChangePillProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return (
      <span className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular',
        'bg-[var(--bg-muted)] text-[var(--text-muted)]',
        className
      )}>—</span>
    );
  }

  const isUp = value > 0;
  const isDown = value < 0;
  const formatted = `${Math.abs(value).toFixed(2)}%`;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular transition-colors duration-200',
      isUp && 'bg-[var(--success-muted)] text-[var(--success)]',
      isDown && 'bg-[var(--danger-muted)] text-[var(--danger)]',
      !isUp && !isDown && 'bg-[var(--bg-muted)] text-[var(--text-muted)]',
      className
    )}>
      {isUp && <span aria-hidden="true" className="text-[10px]">▲</span>}
      {isDown && <span aria-hidden="true" className="text-[10px]">▼</span>}
      <span>{isUp ? '+' : ''}{formatted}</span>
    </span>
  );
}