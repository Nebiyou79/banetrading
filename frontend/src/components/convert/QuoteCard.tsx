// components/convert/QuoteCard.tsx
// ── QUOTE DISPLAY CARD ──

'use client';

import React from 'react';
import type { Currency, ConversionQuote } from '@/types/convert';

interface QuoteCardProps {
  quote: ConversionQuote | null;
  from: Currency | null;
  to: Currency | null;
  secondsToRefresh: number;
  isStale: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

function formatFee(feeBps: number): string {
  return `${(feeBps / 100).toFixed(1)}%`;
}

export default function QuoteCard({
  quote,
  from,
  to,
  secondsToRefresh,
  isStale,
  isLoading,
  onRefresh,
}: QuoteCardProps) {
  if (!quote || !from || !to) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Enter an amount to see a quote</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 transition-colors duration-150 ${
      isStale ? 'border-[var(--warning)] bg-[var(--warning-muted)]' : 'border-[var(--border)] bg-[var(--bg-elevated)]'
    }`}>
      <div className="space-y-2">
        {/* ── Rate ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">Rate</span>
          <span className="text-sm font-semibold text-[var(--text-primary)] tabular">
            1 {from} ≈ {quote.marketRate.toFixed(6)} {to}
          </span>
        </div>

        {/* ── Fee ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">Fee</span>
          <span className="text-sm text-[var(--text-primary)] tabular">
            {formatFee(quote.feeBps)}
          </span>
        </div>

        {/* ── Refresh countdown ── */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            Quote refreshes in {secondsToRefresh}s
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:opacity-80 transition-opacity duration-150 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Refreshing...</span>
              </>
            ) : (
              <span>⟳ Refresh</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}