// components/promo/PromoHero.tsx
// ── PROMO HERO CARD ──

import React, { useState } from 'react';
import type { PromoStats } from '@/types/promo';

interface PromoHeroProps {
  stats: PromoStats | null;
  isLoading: boolean;
  onGenerate: () => void;
  onShare: () => void;
}

export default function PromoHero({ stats, isLoading, onGenerate, onShare }: PromoHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!stats?.code) return;
    await navigator.clipboard.writeText(stats.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8 animate-pulse">
        <div className="h-4 w-32 bg-[var(--bg-muted)] rounded mb-4" />
        <div className="h-14 w-64 bg-[var(--bg-muted)] rounded-xl mb-3" />
        <div className="h-5 w-40 bg-[var(--bg-muted)] rounded" />
      </div>
    );
  }

  if (!stats?.hasCode || !stats?.code) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8 text-center">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Generate Your Promo Code</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Create your unique referral code and start earning bonuses when others sign up.
        </p>
        <button
          onClick={onGenerate}
          className="px-6 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
        >
          Generate Code
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8"
      style={{ boxShadow: '0 0 30px -10px var(--accent-muted)' }}>
      <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        Your Promo Code
      </p>

      {/* ── Code display ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 rounded-xl border-2 border-[var(--border)] bg-[var(--background)] px-6 py-4">
          <span className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-wider tabular">
            {stats.code}
          </span>
        </div>

        {/* ── Copy button ── */}
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
            copied
              ? 'bg-[var(--success-muted)] text-[var(--success)]'
              : 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          {copied ? 'Copied ✓' : '📋 Copy'}
        </button>

        {/* ── Share button ── */}
        <button
          onClick={onShare}
          className="flex-shrink-0 px-4 py-3 rounded-xl font-semibold text-sm bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150"
        >
          🔗 Share
        </button>
      </div>

      {/* ── Total earned ── */}
      <p className="text-sm text-[var(--text-secondary)]">
        Total bonus earned:{' '}
        <span className="tabular text-[var(--success)] font-semibold">
          {stats.totalBonusEarnedUsd.toFixed(2)} USDT
        </span>
      </p>
    </div>
  );
}