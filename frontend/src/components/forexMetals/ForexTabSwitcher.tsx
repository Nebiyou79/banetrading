// components/forexMetals/ForexTabSwitcher.tsx
// ── FOREX/METALS TAB SWITCHER — Professional pill tabs ──

import React from 'react';

interface ForexTabSwitcherProps {
  active: 'forex' | 'metals';
  onChange: (tab: 'forex' | 'metals') => void;
}

export default function ForexTabSwitcher({ active, onChange }: ForexTabSwitcherProps) {
  return (
    <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-1" role="tablist" aria-label="Market type">
      {(['forex', 'metals'] as const).map((tab) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`
              px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
              ${isActive
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] border border-transparent'
              }
            `}
          >
            {tab === 'forex' ? 'Forex' : 'Metals'}
          </button>
        );
      })}
    </div>
  );
}