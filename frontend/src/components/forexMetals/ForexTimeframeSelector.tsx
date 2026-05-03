// components/forexMetals/ForexTimeframeSelector.tsx
// ── FOREX TIMEFRAME SELECTOR — With disabled sub-hourly tooltips ──

import React from 'react';
import clsx from 'clsx';
import type { Timeframe } from '@/types/markets';

interface ForexTimeframeSelectorProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const DISABLED: Timeframe[] = ['1m', '5m', '15m'];

export default function ForexTimeframeSelector({ active, onChange }: ForexTimeframeSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none" role="tablist" aria-label="Chart timeframe">
      {TIMEFRAMES.map((tf) => {
        const isActive = tf === active;
        const isDisabled = DISABLED.includes(tf);

        return (
          <div key={tf} className="relative group shrink-0">
            <button
              role="tab"
              aria-selected={isActive}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !isDisabled && onChange(tf)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                !isDisabled && 'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]',
                isDisabled
                  ? 'bg-[var(--bg-muted)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                  : isActive
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
              )}
            >
              {tf}
            </button>
            {isDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Premium data feed required
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}