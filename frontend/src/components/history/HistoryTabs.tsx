// components/history/HistoryTabs.tsx
// ── HISTORY TAB NAVIGATION ──

import React from 'react';
import type { HistoryItemType } from '@/types/history';

interface HistoryTabsProps {
  active: HistoryItemType | 'all';
  onChange: (tab: HistoryItemType) => void;
}

const TABS: { key: HistoryItemType; label: string }[] = [
  { key: 'trade', label: 'Trades' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'conversion', label: 'Conversions' },
];

export default function HistoryTabs({ active, onChange }: HistoryTabsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Transaction type">
      {TABS.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
            ${active === tab.key
              ? 'bg-[var(--primary-muted)] border border-[var(--accent)] text-[var(--accent)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}