// components/promo/PromoStatsGrid.tsx
// ── 4-CARD STATS GRID ──

import React from 'react';
import clsx from 'clsx';
import type { PromoStats } from '@/types/promo';

interface PromoStatsGridProps {
  stats: PromoStats | null;
  isLoading: boolean;
}

export default function PromoStatsGrid({ stats, isLoading }: PromoStatsGridProps) {
  const cards = [
    {
      label: 'Total Signups',
      value: stats?.signupCount ?? 0,
      subtitle: 'people signed up with your code',
    },
    {
      label: 'Depositors',
      value: stats?.depositorCount ?? 0,
      subtitle: `${stats?.depositorCount ?? 0} of ${stats?.signupCount ?? 0} signups deposited`,
      showOf: true,
    },
    {
      label: 'Signup Bonus',
      value: stats?.signupBonusGranted
        ? `Unlocked +${stats.signupBonusUsd} USDT`
        : `Locked — ${stats?.signupCount ?? 0}/${stats?.signupThreshold ?? 25}`,
      isGranted: stats?.signupBonusGranted ?? false,
    },
    {
      label: 'Deposit Bonus',
      value: stats?.depositBonusGranted
        ? `Unlocked +${stats.depositBonusUsd} USDT`
        : `Locked — ${stats?.depositorCount ?? 0}/${stats?.depositThreshold ?? 25}`,
      isGranted: stats?.depositBonusGranted ?? false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 animate-pulse">
            <div className="h-3 w-20 bg-[var(--bg-muted)] rounded mb-3" />
            <div className="h-7 w-24 bg-[var(--bg-muted)] rounded mb-2" />
            <div className="h-3 w-28 bg-[var(--bg-muted)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats?.hasCode) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            {card.label}
          </span>
          <span className={clsx(
            'tabular text-xl sm:text-2xl font-bold',
            card.isGranted === true
              ? 'text-[var(--success)]'
              : card.isGranted === false
                ? 'text-[var(--warning)]'
                : 'text-[var(--text-primary)]',
          )}>
            {card.value}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {card.subtitle}
          </span>
        </div>
      ))}
    </div>
  );
}