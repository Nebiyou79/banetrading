// components/markets/AssetClassTabs.tsx
// ── ASSET CLASS TAB NAVIGATION ──

'use client';

import React from 'react';
import { useRouter } from 'next/router';
import type { AssetClass } from '@/types/markets';

interface AssetClassTabsProps {
  active: AssetClass;
}

const TABS: { key: AssetClass; label: string; href: string }[] = [
  { key: 'crypto', label: 'Crypto', href: '/markets/crypto' },
  { key: 'forex', label: 'Forex', href: '/markets/forex' },
  { key: 'metals', label: 'Metals', href: '/markets/metals' },
];

export default function AssetClassTabs({ active }: AssetClassTabsProps) {
  const router = useRouter();

  return (
    <div className="flex gap-1.5" role="tablist" aria-label="Market category">
      {TABS.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => router.push(tab.href)}
          className={`
            px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]
            ${
              active === tab.key
                ? 'bg-[var(--accent-muted)] text-[var(--text-primary)] border border-[var(--accent)]/30'
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