// components/crypto/TimeframeSelector.tsx
// ── TIMEFRAME CHIP SELECTOR — 3 timeframes only (15m/1h/4h for crypto) ──

import React from 'react';
import type { Timeframe } from '@/types/markets';

interface TimeframeSelectorProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
  disabledTimeframes?: Timeframe[];
}

// Only 3 timeframes for crypto — reduces API calls by 60%
const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: '15m', label: '15m' },
  { value: '1h',  label: '1h'  },
  { value: '4h',  label: '4h'  },
];

export default function TimeframeSelector({ active, onChange, disabledTimeframes = [] }: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1" role="tablist" aria-label="Chart timeframe">
      {TIMEFRAMES.map(({ value, label }) => {
        const isActive   = value === active;
        const isDisabled = disabledTimeframes.includes(value);

        return (
          <button
            key={value}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !isDisabled && onChange(value)}
            className={`
              shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              ${isDisabled
                ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                : isActive
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