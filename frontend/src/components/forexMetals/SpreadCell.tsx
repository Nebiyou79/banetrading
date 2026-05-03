// components/forexMetals/SpreadCell.tsx
// ── SPREAD CELL — High - Low display ──

import React from 'react';

interface SpreadCellProps {
  high: number | null;
  low: number | null;
  decimals?: number;
  className?: string;
}

export default function SpreadCell({ high, low, decimals = 4, className = '' }: SpreadCellProps) {
  if (high === null || low === null || !Number.isFinite(high) || !Number.isFinite(low)) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }

  const spread = high - low;

  if (spread <= 0) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }

  // Color-code spread: tight spreads are green, wide spreads are yellow
  const isTight = spread < 0.001;
  const color = isTight ? 'text-[var(--success)]' : 'text-[var(--warning)]';

  return (
    <span className={`tabular font-medium ${color} ${className}`}>
      {spread.toFixed(decimals)}
    </span>
  );
}