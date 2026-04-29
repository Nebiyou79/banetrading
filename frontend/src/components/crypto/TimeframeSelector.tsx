// components/crypto/TimeframeSelector.tsx
// ── TIMEFRAME CHIP SELECTOR ──

import React from 'react';
import clsx from 'clsx';
import type { Timeframe } from '@/types/markets';

interface TimeframeSelectorProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function TimeframeSelector({ active, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Chart timeframe">
      {TIMEFRAMES.map(tf => {
        const isActive = tf === active;
        return (
          <button
            key={tf}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]',
              isActive
                ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]',
            )}
            onClick={() => onChange(tf)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(tf);
              }
              const idx = TIMEFRAMES.indexOf(tf);
              if (e.key === 'ArrowRight' && idx < TIMEFRAMES.length - 1) {
                e.preventDefault();
                onChange(TIMEFRAMES[idx + 1]);
              }
              if (e.key === 'ArrowLeft' && idx > 0) {
                e.preventDefault();
                onChange(TIMEFRAMES[idx - 1]);
              }
            }}
          >
            {tf}
          </button>
        );
      })}
    </div>
  );
}