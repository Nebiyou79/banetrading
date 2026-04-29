// components/markets/PriceCell.tsx
// ── FORMATTED PRICE CELL ──

import React from 'react';

interface PriceCellProps {
  value: number | null;
  className?: string;
   decimals?: number;
}

function formatPrice(value: number, decimals?: number): string {
  if (typeof decimals === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  // ── < $1: show 4–6 decimals ──
  const abs = Math.abs(value);
  if (abs >= 0.01) decimals = 4;
  if (abs >= 0.1) decimals = 4;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Update the component to pass decimals:
export default function PriceCell({ value, className = '', decimals }: PriceCellProps) {
  if (value === null || value === undefined) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }
  return (
    <span className={`tabular text-[var(--text-primary)] ${className}`}>
      {formatPrice(value, decimals)}
    </span>
  );
}