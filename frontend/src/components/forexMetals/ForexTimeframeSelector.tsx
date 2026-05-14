// components/forexMetals/ForexTimeframeSelector.tsx
// ── FOREX TIMEFRAME SELECTOR — 3 timeframes only (1h/4h/1d for forex/metals) ──

import React from 'react';
import type { Timeframe } from '@/types/markets';

interface ForexTimeframeSelectorProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
}

// Only 3 timeframes for forex/metals — sub-hourly not available on free tier
const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
];

export default function ForexTimeframeSelector({ active, onChange }: ForexTimeframeSelectorProps) {
  return (
    <div className="flex gap-1" role="tablist" aria-label="Chart timeframe">
      {TIMEFRAMES.map(({ value, label }) => {
        const isActive = value === active;
        return (
          <button
            key={value}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(value)}
            className={`
              shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              ${isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}