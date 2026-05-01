// components/promo/PromoLeaderboard.tsx
// ── LEADERBOARD ──

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { usePromoLeaderboard } from '@/hooks/usePromoLeaderboard';
import clsx from 'clsx';

export default function PromoLeaderboard() {
  const { leaderboard, isLoading } = usePromoLeaderboard();
  const { isMobile } = useResponsive();

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Top Referrers</h3>
        <p className="text-xs text-[var(--text-muted)]">Top 10 promo codes by depositors this month</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 bg-[var(--bg-muted)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--text-muted)]">
          No leaderboard data yet
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {leaderboard.map(entry => (
            <div
              key={entry.rank}
              className={clsx(
                'rounded-xl border p-4',
                entry.isCurrentUser
                  ? 'border-[var(--accent)] bg-[var(--primary-muted)]'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)]',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--accent)]">#{entry.rank}</span>
                <span className="tabular font-mono text-sm text-[var(--text-primary)]">{entry.codeMasked}</span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
                <span>Signups: <span className="tabular">{entry.signupCount}</span></span>
                <span>Depositors: <span className="tabular">{entry.depositorCount}</span></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full">
            <thead className="bg-[var(--bg-elevated)]">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Rank</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Code</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Signups</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase">Depositors</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(entry => (
                <tr
                  key={entry.rank}
                  className={clsx(
                    'border-t border-[var(--border)] transition-colors duration-150',
                    entry.isCurrentUser
                      ? 'bg-[var(--primary-muted)]'
                      : 'hover:bg-[var(--hover-bg)]',
                  )}
                >
                  <td className="py-3 px-4 font-bold text-[var(--accent)] tabular">#{entry.rank}</td>
                  <td className="py-3 px-4 font-mono tabular text-sm text-[var(--text-primary)]">{entry.codeMasked}</td>
                  <td className="py-3 px-4 tabular text-sm text-[var(--text-secondary)]">{entry.signupCount}</td>
                  <td className="py-3 px-4 tabular text-sm font-medium text-[var(--text-primary)] text-right">{entry.depositorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}