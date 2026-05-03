// components/trade/YourTradesTable.tsx
// ── YOUR TRADES TABLE — Professional trade history ──

import { BarChart2 } from 'lucide-react';
import type { Trade } from '@/types/trade';

interface YourTradesTableProps {
  activeTrades: Trade[];
  historyTrades: Trade[];
  historyTotal: number;
  historyOffset: number;
  onLoadMore: () => void;
  isLoading: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatNum(v: number, asset: string): string {
  if (asset === 'USDT') return v.toFixed(2);
  if (v < 0.0001) return v.toFixed(8);
  if (v < 1) return v.toFixed(6);
  return v.toFixed(4);
}

export function YourTradesTable({
  activeTrades,
  historyTrades,
  historyTotal,
  historyOffset,
  onLoadMore,
  isLoading,
}: YourTradesTableProps) {
  const isEmpty = activeTrades.length === 0 && historyTrades.length === 0;
  const hasMore = historyOffset + historyTrades.length < historyTotal;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
          Trade History
        </h3>
      </div>

      {isEmpty && !isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <BarChart2 className="w-12 h-12 text-[var(--text-muted)]/30" />
          <p className="text-sm text-[var(--text-muted)]">No trades yet</p>
          <p className="text-xs text-[var(--text-muted)]/70">Your trade history will appear here</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/50">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pair</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Amount</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Plan</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Time</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {activeTrades.map((t) => (
                  <tr key={t._id} className="hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex rounded-md bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
                        {t.pairDisplay}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular text-sm text-[var(--text-primary)]">
                      {formatNum(t.stake, t.tradingAsset)} {t.tradingAsset}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                        {t.planKey}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--accent)] font-medium">
                      ⏱ Active
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--info-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--info)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] animate-pulse" />
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-[var(--text-muted)]">—</td>
                  </tr>
                ))}
                {historyTrades.map((t) => {
                  const isWon = t.status === 'won';
                  return (
                    <tr key={t._id} className="hover:bg-[var(--hover-bg)] transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-md bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
                          {t.pairDisplay}
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular text-sm text-[var(--text-primary)]">
                        {formatNum(t.stake, t.tradingAsset)} {t.tradingAsset}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                          {t.planKey}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                        {relativeTime(t.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isWon ? 'bg-[var(--success-muted)] text-[var(--success)]' : 'bg-[var(--danger-muted)] text-[var(--danger)]'
                        }`}>
                          {isWon ? 'Won' : 'Lost'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right tabular text-sm font-semibold ${
                        isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                      }`}>
                        {isWon ? '+' : ''}{formatNum(t.netResult ?? 0, t.tradingAsset)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {activeTrades.map((t) => (
              <div key={t._id} className="p-4 hover:bg-[var(--hover-bg)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">{t.pairDisplay}</span>
                  <span className="text-xs text-[var(--info)] animate-pulse">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{formatNum(t.stake, t.tradingAsset)}</span>
                  <span className="text-[var(--text-secondary)]">{t.planKey}</span>
                </div>
              </div>
            ))}
            {historyTrades.map((t) => (
              <div key={t._id} className="p-4 hover:bg-[var(--hover-bg)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">{t.pairDisplay}</span>
                  <span className={`text-xs font-semibold ${t.status === 'won' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {t.status === 'won' ? '+' : ''}{formatNum(t.netResult ?? 0, t.tradingAsset)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>{formatNum(t.stake, t.tradingAsset)}</span>
                  <span>{relativeTime(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="px-4 py-3 border-t border-[var(--border)] flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}