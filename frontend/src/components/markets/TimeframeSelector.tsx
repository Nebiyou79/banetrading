// components/markets/TimeframeSelector.tsx
// ── TIMEFRAME SELECTOR WITH DISABLED/TOOLTIP SUPPORT ──

'use client';

import React from 'react';
import clsx from 'clsx';
import type { Timeframe } from '@/types/markets';

interface TimeframeSelectorProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
  disabledTimeframes?: Timeframe[];
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function TimeframeSelector({
  active,
  onChange,
  disabledTimeframes = [],
}: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Chart timeframe">
      {TIMEFRAMES.map(tf => {
        const isActive = tf === active;
        const isDisabled = disabledTimeframes.includes(tf);
        return (
          <div key={tf} className="relative group flex-shrink-0">
            <button
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                !isDisabled && 'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]',
                isDisabled
                  ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                  : isActive
                    ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]',
              )}
              onClick={() => !isDisabled && onChange(tf)}
            >
              {tf}
            </button>
            {/* ── Tooltip for disabled ── */}
            {isDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-20">
                Premium data feed required for this interval.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}