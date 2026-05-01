// components/promo/PromoMilestoneTracker.tsx
// ── TWO PROGRESS BARS ──

import React, { useEffect, useRef } from 'react';
import type { PromoStats } from '@/types/promo';

interface PromoMilestoneTrackerProps {
  stats: PromoStats | null;
  isLoading: boolean;
}

function ProgressBar({
  label,
  reward,
  current,
  target,
  isGranted,
  grantedAt,
}: {
  label: string;
  reward: string;
  current: number;
  target: number;
  isGranted: boolean;
  grantedAt?: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const wasGrantedRef = useRef(isGranted);

  useEffect(() => {
    if (isGranted && !wasGrantedRef.current) {
      // Trigger confetti
      try {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        });
      } catch { /* ignore */ }
    }
    wasGrantedRef.current = isGranted;
  }, [isGranted]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        <span className={`text-sm font-medium tabular ${isGranted ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
          {reward}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-2 rounded-full bg-[var(--card)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-600 ease-out ${isGranted ? 'bg-[var(--success)]' : 'bg-[var(--accent)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs tabular ${isGranted ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
          {isGranted ? '✓ Unlocked!' : `${current} / ${target}`}
        </span>
        {isGranted && grantedAt && (
          <span className="text-xs text-[var(--text-muted)]">
            Granted on {new Date(grantedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PromoMilestoneTracker({ stats, isLoading }: PromoMilestoneTrackerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-[var(--bg-muted)] rounded-xl" />
        <div className="h-24 bg-[var(--bg-muted)] rounded-xl" />
      </div>
    );
  }

  if (!stats?.hasCode) return null;

  return (
    <div className="space-y-4">
      <ProgressBar
        label="Signup Milestone"
        reward={`+${stats.signupBonusUsd} USDT reward`}
        current={stats.signupCount}
        target={stats.signupThreshold}
        isGranted={stats.signupBonusGranted}
        grantedAt={stats.signupBonusGrantedAt}
      />
      <ProgressBar
        label="Deposit Milestone"
        reward={`+${stats.depositBonusUsd} USDT reward`}
        current={stats.depositorCount}
        target={stats.depositThreshold}
        isGranted={stats.depositBonusGranted}
        grantedAt={stats.depositBonusGrantedAt}
      />
    </div>
  );
}