// components/history/ConversionsHistoryTable.tsx
// ── CONVERSIONS HISTORY TABLE ──

import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import type { ConversionHistoryItem } from '@/types/history';
import { StatusPillFromString } from '@/components/ui/StatusPill';

interface ConversionsHistoryTableProps {
  items: ConversionHistoryItem[];
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

function formatAmount(amount: number, currency: string): string {
  // ── Format based on currency type ──
  if (currency === 'USDT') return amount.toFixed(2);
  if (currency === 'BTC') return amount.toFixed(8);
  if (currency === 'ETH' || currency === 'SOL' || currency === 'BNB') return amount.toFixed(6);
  return amount.toFixed(4);
}

export default function ConversionsHistoryTable({
  items,
  isLoading = false,
}: ConversionsHistoryTableProps) {
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
            {/* ── Top row: Pair + Status ── */}
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm text-[var(--text-primary)]">
                  {item.fromCurrency} → {item.toCurrency}
                </div>
              </div>
              <StatusPillFromString
                status={item.status as 'completed' | 'failed'}
              />
            </div>

            {/* ── Middle: Amounts ── */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">From:</span>
                <span className="tabular font-medium text-[var(--text-primary)]">
                  {formatAmount(item.fromAmount, item.fromCurrency)} {item.fromCurrency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">To:</span>
                <span className="tabular font-medium text-[var(--text-primary)]">
                  {formatAmount(item.toAmount, item.toCurrency)} {item.toCurrency}
                </span>
              </div>
            </div>

            {/* ── Bottom: Rate + Date ── */}
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[var(--text-muted)] tabular">
                Rate: {item.rate.toFixed(6)}
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
              From → To
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              From Amount
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              To Amount
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              Rate
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
              {/* ── From → To ── */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.fromCurrency}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-[var(--text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.toCurrency}
                  </span>
                </div>
              </td>

              {/* ── From Amount ── */}
              <td className="py-3 px-4 text-sm tabular text-[var(--text-primary)]">
                {formatAmount(item.fromAmount, item.fromCurrency)}{' '}
                <span className="text-[var(--text-muted)]">{item.fromCurrency}</span>
              </td>

              {/* ── To Amount ── */}
              <td className="py-3 px-4 text-sm tabular text-[var(--text-primary)]">
                {formatAmount(item.toAmount, item.toCurrency)}{' '}
                <span className="text-[var(--text-muted)]">{item.toCurrency}</span>
              </td>

              {/* ── Rate ── */}
              <td className="py-3 px-4 text-sm tabular text-[var(--text-secondary)]">
                {item.rate.toFixed(6)}
              </td>

              {/* ── Date ── */}
              <td className="py-3 px-4 text-sm tabular text-[var(--text-muted)]">
                {formatDate(item.createdAt)}
              </td>

              {/* ── Status ── */}
              <td className="py-3 px-4 text-right">
                <StatusPillFromString
                  status={item.status as 'completed' | 'failed'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}