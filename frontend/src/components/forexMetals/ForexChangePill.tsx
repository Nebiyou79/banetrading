// components/forexMetals/ForexChangePill.tsx
// ── 24H CHANGE PILL FOR FOREX/METALS ──

import React from 'react';
import clsx from 'clsx';

interface ForexChangePillProps {
  value: number | null;
  className?: string;
}

export default function ForexChangePill({ value, className = '' }: ForexChangePillProps) {
  if (value === null || value === undefined) {
    return <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-sm tabular bg-[var(--bg-muted)] text-[var(--text-muted)]', className)}>—</span>;
  }
  const isGain = value > 0;
  const isLoss = value < 0;
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  return (
    <span className={clsx('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-sm font-medium tabular transition-colors duration-150', isGain && 'text-gain bg-[var(--success-muted)]', isLoss && 'text-loss bg-[var(--danger-muted)]', !isGain && !isLoss && 'bg-[var(--bg-muted)] text-[var(--text-muted)]', className)}>
      {isGain && <span aria-hidden="true">▲</span>}
      {isLoss && <span aria-hidden="true">▼</span>}
      <span>{isGain ? '+' : ''}{formatted}</span>
    </span>
  );
}