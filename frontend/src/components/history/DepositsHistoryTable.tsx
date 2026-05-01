// components/history/DepositsHistoryTable.tsx
// ── DEPOSITS HISTORY TABLE ──

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import type { DepositHistoryItem } from '@/types/history';
import { StatusPillFromString } from '@/components/ui/StatusPill';

interface DepositsHistoryTableProps {
  items: DepositHistoryItem[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function DepositsHistoryTable({ items, isLoading = false }: DepositsHistoryTableProps) {
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
                <div className="font-semibold text-sm text-[var(--text-primary)]">{item.currency}</div>
                <div className="text-xs text-[var(--text-muted)]">{item.network}</div>
              </div>
              <StatusPillFromString status={item.status} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="tabular text-sm font-semibold text-[var(--text-primary)]">{item.amount.toFixed(4)}</span>
              <span className="text-xs text-[var(--text-muted)]">{formatDate(item.createdAt)}</span>
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
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Asset</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Amount</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Date</th>
            <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150">
              <td className="py-3 px-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{item.currency}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.network}</div>
                </div>
              </td>
              <td className="py-3 px-4 text-sm tabular text-[var(--text-primary)]">{item.amount.toFixed(4)}</td>
              <td className="py-3 px-4 text-sm tabular text-[var(--text-muted)]">{formatDate(item.createdAt)}</td>
              <td className="py-3 px-4 text-right">
                <StatusPillFromString status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}