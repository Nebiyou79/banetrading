// components/forexMetals/ForexPriceCell.tsx
// ── FOREX PRICE CELL — Proper decimal formatting ──

import React from 'react';

interface ForexPriceCellProps {
  value: number | null;
  decimals?: number;
  className?: string;
}

function formatPrice(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function ForexPriceCell({ value, decimals = 4, className = '' }: ForexPriceCellProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }
  return (
    <span className={`tabular text-[var(--text-primary)] ${className}`}>
      <span className="text-[var(--text-muted)] text-xs mr-0.5">$</span>
      {formatPrice(value, decimals)}
    </span>
  );
}