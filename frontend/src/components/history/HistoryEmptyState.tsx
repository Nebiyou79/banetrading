// components/history/HistoryEmptyState.tsx
// ── EMPTY STATE PER TAB ──

import React from 'react';
import { useRouter } from 'next/router';
import type { HistoryItemType } from '@/types/history';

interface HistoryEmptyStateProps {
  type: HistoryItemType | 'all';
}

const EMPTY_CONFIG: Record<string, { message: string; cta: string; href: string }> = {
  trade:       { message: 'No trades yet — start trading to see your history here', cta: 'Start Trading', href: '/trade' },
  deposit:     { message: 'No deposits yet — fund your account to get started', cta: 'Make a Deposit', href: '/balance' },
  withdrawal:  { message: 'No withdrawals yet', cta: 'Go to Balance', href: '/balance?action=withdraw' },
  conversion:  { message: 'No conversions yet — try converting between currencies', cta: 'Convert Now', href: '/convert' },
  all:         { message: 'No transaction history yet', cta: 'Go to Dashboard', href: '/dashboard' },
};

export default function HistoryEmptyState({ type }: HistoryEmptyStateProps) {
  const router = useRouter();
  const config = EMPTY_CONFIG[type] || EMPTY_CONFIG.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* ── Icon ── */}
      <svg className="w-16 h-16 mb-4 text-[var(--text-muted)] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>

      <p className="text-sm text-[var(--text-muted)] mb-4">{config.message}</p>

      <button
        onClick={() => router.push(config.href)}
        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
      >
        {config.cta}
      </button>
    </div>
  );
}