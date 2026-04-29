// components/markets/ForexPairBadge.tsx
// ── FOREX/METAL PAIR BADGE (CSS-only) ──

import React from 'react';

interface ForexPairBadgeProps {
  symbol: string;
  display: string;
  color?: string;
  size?: number;
}

export default function ForexPairBadge({
  symbol,
  display,
  color,
  size = 32,
}: ForexPairBadgeProps) {
  const base = symbol.slice(0, 3);
  const quote = symbol.slice(3);
  const fontSize = Math.max(size * 0.35, 10);

  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {/* ── Two letter circles ── */}
      <div className="relative flex-shrink-0" style={{ width: size * 1.5, height: size }}>
        <div
          className="absolute left-0 top-0 rounded-full flex items-center justify-center font-bold text-[var(--text-inverse)]"
          style={{
            width: size,
            height: size,
            backgroundColor: color || 'var(--accent)',
            fontSize,
            zIndex: 2,
          }}
        >
          {base}
        </div>
        <div
          className="absolute right-0 top-0 rounded-full flex items-center justify-center font-bold text-[var(--text-inverse)]"
          style={{
            width: size,
            height: size,
            backgroundColor: 'var(--bg-muted)',
            border: '2px solid var(--border)',
            fontSize,
            zIndex: 1,
          }}
        >
          {quote}
        </div>
      </div>
      <div>
        <div className="font-semibold text-sm text-[var(--text-primary)] tabular">
          {display}
        </div>
        <div className="text-xs text-[var(--text-muted)]">{symbol}</div>
      </div>
    </div>
  );
}