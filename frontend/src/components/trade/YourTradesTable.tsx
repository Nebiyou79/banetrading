// components/trade/YourTradesTable.tsx
// ── YOUR TRADES TABLE ──
import { useState, useEffect } from 'react';
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

function ActiveCountdown({ expiresAt }: { expiresAt: string }) {
  const calc = () =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const [s, setS] = useState(calc);

  useEffect(() => {
    const i = setInterval(() => {
      const n = calc();
      setS(n);
      if (n <= 0) clearInterval(i);
    }, 1000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const m = Math.floor(s / 60);
  const sec = s % 60;
  return (
    <span className="tabular text-[var(--accent)]">{`${m}:${String(sec).padStart(2, '0')} ⏱`}</span>
  );
}

function Row({ trade, isActive }: { trade: Trade; isActive: boolean }) {
  const isWon = trade.status === 'won';
  const isLost = trade.status === 'lost';

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 md:contents">
      {/* Pair */}
      <span className="md:flex md:items-center md:py-3 md:pr-4">
        <span className="rounded-md bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
          {trade.pairDisplay}
        </span>
      </span>

      {/* Amount */}
      <span className="tabular text-sm font-medium text-[var(--text-primary)] md:py-3 md:pr-4">
        {formatNum(trade.stake, trade.tradingAsset)} {trade.tradingAsset}
      </span>

      {/* Plan */}
      <span className="md:py-3 md:pr-4">
        <span className="inline-flex rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
          {trade.planKey} · {trade.planDurationSec}s
        </span>
      </span>

      {/* Time */}
      <span className="text-sm text-[var(--text-secondary)] md:py-3 md:pr-4">
        {isActive ? (
          <ActiveCountdown expiresAt={trade.expiresAt} />
        ) : (
          relativeTime(trade.createdAt)
        )}
      </span>

      {/* Status */}
      <span className="md:py-3 md:pr-4">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            isActive
              ? 'bg-[var(--info-muted)] text-[var(--info)]'
              : isWon
              ? 'bg-[var(--success-muted)] text-[var(--success)]'
              : 'bg-[var(--danger-muted)] text-[var(--danger)]'
          }`}
        >
          {isActive ? 'Active' : isWon ? 'Won' : 'Lost'}
        </span>
      </span>

      {/* Result */}
      <span
        className={`tabular text-sm font-semibold md:py-3 ${
          isActive
            ? 'text-[var(--text-muted)]'
            : isWon
            ? 'text-gain'
            : 'text-loss'
        }`}
      >
        {isActive
          ? '—'
          : `${isWon ? '+' : ''}${formatNum(trade.netResult ?? 0, trade.tradingAsset)} ${trade.tradingAsset}`}
      </span>
    </div>
  );
}

export function YourTradesTable({
  activeTrades,
  historyTrades,
  historyTotal,
  historyOffset,
  onLoadMore,
  isLoading,
}: YourTradesTableProps) {
  const hasMore = historyOffset + historyTrades.length < historyTotal;
  const isEmpty = activeTrades.length === 0 && historyTrades.length === 0;

  if (isEmpty && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <BarChart2 className="h-10 w-10 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">No trades yet</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-bold text-[var(--text-primary)]">
        Your Trades
      </h2>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] md:block">
        <div className="grid grid-cols-6 gap-2 bg-[var(--bg-muted)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          <span>Pair</span>
          <span>Amount</span>
          <span>Plan</span>
          <span>Time</span>
          <span>Status</span>
          <span>Result</span>
        </div>
        <div className="flex flex-col">
          {activeTrades.map((t) => (
            <div
              key={t._id}
              className="grid grid-cols-6 gap-2 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
            >
              <Row trade={t} isActive />
            </div>
          ))}
          {historyTrades.map((t) => (
            <div
              key={t._id}
              className="grid grid-cols-6 gap-2 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 last:border-none"
            >
              <Row trade={t} isActive={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {activeTrades.map((t) => (
          <Row key={t._id} trade={t} isActive />
        ))}
        {historyTrades.map((t) => (
          <Row key={t._id} trade={t} isActive={false} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}