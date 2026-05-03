// components/crypto/TimeframeSelector.tsx
// ── TIMEFRAME CHIP SELECTOR — Professional button group ──

import React from 'react';
import type { Timeframe } from '@/types/markets';

interface TimeframeSelectorProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
  disabledTimeframes?: Timeframe[];
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function TimeframeSelector({ active, onChange, disabledTimeframes = [] }: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none" role="tablist" aria-label="Chart timeframe">
      {TIMEFRAMES.map((tf) => {
        const isActive = tf === active;
        const isDisabled = disabledTimeframes.includes(tf);

        return (
          <button
            key={tf}
            role="tab"
            aria-selected={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !isDisabled && onChange(tf)}
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
            {tf}
          </button>
        );
      })}
    </div>
  );
}