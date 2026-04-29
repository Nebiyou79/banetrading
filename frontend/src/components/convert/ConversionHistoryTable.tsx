// components/convert/ConversionHistoryTable.tsx
// ── CONVERSION HISTORY ──

'use client';

import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import type { ConversionRecord } from '@/types/convert';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ConversionHistoryTable() {
  const { isMobile } = useResponsive();
  const { conversions, isLoading } = useConversionHistory(20);
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      {/* ── Header (collapsible) ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Conversions</h3>
        <svg
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-150 ${collapsed ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-10 bg-[var(--bg-muted)] rounded animate-pulse" />
            ))}</div>
          ) : conversions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">No conversions yet</p>
          ) : isMobile ? (
            <div className="space-y-3">
              {conversions.map(conv => (
                <div key={conv._id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{conv.fromCurrency} → {conv.toCurrency}</span>
                    <span className="tabular">{formatDate(conv.createdAt)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm font-medium text-[var(--text-primary)] tabular">
                      {conv.fromAmount.toLocaleString()} → {conv.toAmount.toFixed(6)}
                    </span>
                    <span className={`text-xs font-medium ${conv.status === 'completed' ? 'text-gain' : 'text-loss'}`}>
                      {conv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border)]">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Pair</th>
                    <th className="py-2 text-right">From</th>
                    <th className="py-2 text-right">To</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map(conv => (
                    <tr key={conv._id} className="border-b border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors duration-150">
                      <td className="py-2.5 text-[var(--text-muted)] tabular">{formatDate(conv.createdAt)}</td>
                      <td className="py-2.5 text-[var(--text-primary)] tabular">
                        {conv.fromCurrency} → {conv.toCurrency}
                      </td>
                      <td className="py-2.5 text-right text-[var(--text-primary)] tabular">{conv.fromAmount.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-[var(--text-primary)] tabular">{conv.toAmount.toFixed(6)}</td>
                      <td className="py-2.5 text-right text-[var(--text-muted)] tabular">{conv.rate.toFixed(6)}</td>
                      <td className={`py-2.5 text-right font-medium ${conv.status === 'completed' ? 'text-gain' : 'text-loss'}`}>
                        {conv.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}