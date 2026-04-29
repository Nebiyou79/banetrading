// components/forexMetals/ForexPriceCell.tsx
// ── FORMATTED FOREX/METALS PRICE CELL ──

import React from 'react';

interface ForexPriceCellProps {
  value: number | null;
  decimals?: number;
  className?: string;
}

function formatPrice(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function ForexPriceCell({ value, decimals = 4, className = '' }: ForexPriceCellProps) {
  if (value === null || value === undefined) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }
  return <span className={`tabular text-[var(--text-primary)] ${className}`}>{formatPrice(value, decimals)}</span>;
}