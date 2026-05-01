// components/promo/PromoReferralsList.tsx
// ── RECENT REFERRALS LIST ──

import React from 'react';
import { useMyReferrals } from '@/hooks/useMyReferrals';
import clsx from 'clsx';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PromoReferralsList() {
  const { referrals, isLoading } = useMyReferrals(20);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Referrals</h3>
        <p className="text-xs text-[var(--text-muted)]">Last 20 people who signed up with your code</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 bg-[var(--bg-muted)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : referrals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="w-12 h-12 mb-3 text-[var(--text-muted)] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-sm text-[var(--text-muted)] mb-2">No one&apos;s used your code yet</p>
          <p className="text-xs text-[var(--text-muted)]">Share your code to start earning!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map((ref, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3"
            >
              <div className="flex items-center gap-3">
                {/* ── Avatar ── */}
                <div className="h-8 w-8 rounded-full bg-[var(--primary-muted)] text-[var(--accent)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {ref.initials}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] tabular">
                  {ref.initials}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)] tabular">
                  {formatRelative(ref.signedUpAt)}
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    ref.hasDeposited
                      ? 'bg-[var(--success-muted)] text-[var(--success)] border border-[var(--success)]'
                      : 'bg-[var(--card)] text-[var(--text-muted)] border border-[var(--border)]',
                  )}
                >
                  {ref.hasDeposited ? 'Deposited' : 'No deposit yet'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}