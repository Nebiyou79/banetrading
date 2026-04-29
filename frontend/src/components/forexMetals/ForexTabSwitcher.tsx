// components/forexMetals/ForexTabSwitcher.tsx
// ── FOREX | METALS TAB SWITCHER ──

import React from 'react';

interface ForexTabSwitcherProps {
  active: 'forex' | 'metals';
  onChange: (tab: 'forex' | 'metals') => void;
}

export default function ForexTabSwitcher({ active, onChange }: ForexTabSwitcherProps) {
  return (
    <div className="flex gap-1.5" role="tablist" aria-label="Market type">
      {(['forex', 'metals'] as const).map(tab => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${active === tab ? 'bg-[var(--accent-muted)] text-[var(--text-primary)] border border-[var(--accent)]/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'}`}
        >
          {tab === 'forex' ? 'Forex' : 'Metals'}
        </button>
      ))}
    </div>
  );
}