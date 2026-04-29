// components/crypto/CryptoFilterChips.tsx
// ── FILTER CHIP BAR ──

import React from 'react';

type FilterKey = 'all' | 'gainers' | 'losers' | 'favorites';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
  { key: 'favorites', label: 'Favorites' },
];

interface CryptoFilterChipsProps {
  active: FilterKey;
  onChange: (key: FilterKey) => void;
}

export default function CryptoFilterChips({ active, onChange }: CryptoFilterChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" role="tablist">
      {FILTERS.map(f => (
        <button key={f.key} role="tab" aria-selected={active === f.key} onClick={() => onChange(f.key)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${active === f.key ? 'bg-[var(--accent)] text-[var(--text-inverse)]' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'}`}>
          {f.label}
        </button>
      ))}
    </div>
  );
}