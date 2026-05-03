// components/crypto/CryptoPriceCell.tsx
// ── CRYPTO PRICE CELL — Smart decimal formatting ──

import React from 'react';

interface CryptoPriceCellProps {
  value: number | null;
  className?: string;
}

function formatPrice(value: number): string {
  if (value >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  }
  const abs = Math.abs(value);
  let decimals = 6;
  if (abs >= 0.01) decimals = 4;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: decimals,
  }).format(value);
}

export default function CryptoPriceCell({ value, className = '' }: CryptoPriceCellProps) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className={`tabular text-[var(--text-muted)] ${className}`}>—</span>;
  }
  return <span className={`tabular text-[var(--text-primary)] ${className}`}>{formatPrice(value)}</span>;
}