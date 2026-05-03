// components/forexMetals/ForexPairBadge.tsx
// ── FOREX PAIR BADGE — Professional overlapping circles design ──

import React from 'react';

interface ForexPairBadgeProps {
  symbol: string;
  display: string;
  size?: number;
  showName?: boolean;
}

export default function ForexPairBadge({ symbol, display, size = 28, showName = true }: ForexPairBadgeProps) {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);
  const fontSize = Math.max(size * 0.32, 8);

  return (
    <div className="flex items-center gap-2.5">
      {/* Overlapping Circles */}
      <div className="relative shrink-0" style={{ width: size * 1.4, height: size }}>
        {/* Base Currency (left circle) */}
        <div
          className="absolute left-0 top-0 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
          style={{
            width: size,
            height: size,
            backgroundColor: 'var(--accent)',
            fontSize,
            zIndex: 2,
          }}
        >
          {base}
        </div>
        {/* Quote Currency (right circle) */}
        <div
          className="absolute right-0 top-0 rounded-full flex items-center justify-center font-bold shadow-sm"
          style={{
            width: size,
            height: size,
            backgroundColor: 'var(--bg-muted)',
            border: '2px solid var(--border)',
            fontSize,
            zIndex: 1,
            color: 'var(--text-primary)',
          }}
        >
          {quote}
        </div>
      </div>

      {/* Labels */}
      {showName && (
        <div className="min-w-0">
          <div className="font-semibold text-sm text-[var(--text-primary)] tabular truncate">{display}</div>
          <div className="text-[11px] text-[var(--text-muted)] tabular">{symbol}</div>
        </div>
      )}
    </div>
  );
}