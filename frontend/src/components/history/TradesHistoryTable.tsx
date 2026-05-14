// components/history/TradesHistoryTable.tsx
// ── TRADES HISTORY TABLE ──

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import type { TradeHistoryItem } from '@/types/history';
import { StatusPill } from '@/components/ui/StatusPill';

interface TradesHistoryTableProps {
  items: TradeHistoryItem[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatTradeAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '0.0000';
  return amount.toFixed(4);
}

function formatTradeResult(result: number | undefined | null): string {
  if (result === undefined || result === null) return '0.00';
  const prefix = result >= 0 ? '+' : '';
  return `${prefix}${result.toFixed(2)}`;
}

export default function TradesHistoryTable({ items, isLoading = false }: TradesHistoryTableProps) {
  const { isMobile } = useResponsive();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 bg-[var(--bg-muted)] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">{item.pair}</div>
                <div className="text-xs text-[var(--text-muted)]">{item.plan}</div>
              </div>
              <span className={`tabular text-sm font-semibold ${(item.result ?? 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {formatTradeResult(item.result)}
              </span>
            </div>
            <div className="flex justify-between mt-2 text-xs text-[var(--text-muted)]">
              <span>Amount: <span className="tabular">{formatTradeAmount(item.amount)}</span></span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full">
        <thead className="bg-[var(--bg-elevated)]">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Pair</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Amount</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Plan</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Duration</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Date</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase">Result</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150">
              <td className="py-3 px-4 text-sm font-medium text-[var(--text-primary)]">{item.pair}</td>
              <td className="py-3 px-4 text-sm tabular text-[var(--text-primary)]">{formatTradeAmount(item.amount)}</td>
              <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">{item.plan}</td>
              <td className="py-3 px-4 text-sm tabular text-[var(--text-secondary)]">{item.duration}s</td>
              <td className="py-3 px-4 text-sm tabular text-[var(--text-muted)]">{formatDate(item.createdAt)}</td>
              <td className={`py-3 px-4 text-sm font-semibold tabular text-right ${(item.result ?? 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {formatTradeResult(item.result)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}