// components/forexMetals/SpreadCell.tsx
// ── SPREAD CELL (high - low) ──

import React from 'react';

interface SpreadCellProps {
  high: number | null;
  low: number | null;
  decimals?: number;
  className?: string;
}

export default function SpreadCell({ high, low, decimals = 4, className = '' }: SpreadCellProps) {
  if (high === null || low === null) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }
  const spread = high - low;
  return <span className={`tabular text-[var(--text-secondary)] ${className}`}>{spread.toFixed(decimals)}</span>;
}