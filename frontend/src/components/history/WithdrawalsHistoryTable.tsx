// components/history/WithdrawalsHistoryTable.tsx
// ── WITHDRAWALS HISTORY TABLE ──

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import type { WithdrawalHistoryItem } from '@/types/history';
import { StatusPillFromString } from '@/components/ui/StatusPill';

interface WithdrawalsHistoryTableProps {
  items: WithdrawalHistoryItem[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateAddress(address: string): string {
  if (!address || address.length <= 12) return address || '—';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

function formatAmount(amount: number): string {
  return amount.toFixed(4);
}

export default function WithdrawalsHistoryTable({
  items,
  isLoading = false,
}: WithdrawalsHistoryTableProps) {
  const { isMobile } = useResponsive();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-12 bg-[var(--bg-muted)] rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
          >
            {/* ── Top row: Asset + Status ── */}
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">
                  {item.currency}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{item.network}</div>
              </div>
              <StatusPillFromString
                status={item.status}
              />
            </div>

            {/* ── Middle: Amount ── */}
            <div className="mt-2">
              <span className="tabular text-sm font-semibold text-[var(--text-primary)]">
                {formatAmount(item.amount)}
              </span>
            </div>

            {/* ── Bottom: Address + Date ── */}
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[var(--text-muted)] truncate max-w-[60%]">
                {truncateAddress(item.address)}
              </span>
              <span className="text-xs text-[var(--text-muted)] tabular">
                {formatDate(item.createdAt)}
              </span>
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
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Asset
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Amount
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Address
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Date
            </th>
            <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr
              key={item.id}
              className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
            >
              {/* ── Asset ── */}
              <td className="py-3 px-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {item.currency}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {item.network}
                  </div>
                </div>
              </td>

              {/* ── Amount ── */}
              <td className="py-3 px-4 text-sm tabular text-[var(--text-primary)]">
                {formatAmount(item.amount)}
              </td>

              {/* ── Address (truncated) ── */}
              <td className="py-3 px-4">
                <span
                  className="text-sm tabular text-[var(--text-secondary)] font-mono"
                  title={item.address}
                >
                  {truncateAddress(item.address)}
                </span>
              </td>

              {/* ── Date ── */}
              <td className="py-3 px-4 text-sm tabular text-[var(--text-muted)]">
                {formatDate(item.createdAt)}
              </td>

              {/* ── Status ── */}
              <td className="py-3 px-4 text-right">
                <StatusPillFromString
                  status={item.status}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}