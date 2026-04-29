/* eslint-disable @typescript-eslint/no-explicit-any */
// components/convert/ConvertConfirmModal.tsx
// ── CONFIRMATION MODAL ──

'use client';

import React, { useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import ConversionSuccessCard from './ConversionSuccessCard';
import type { Currency, ConversionQuote } from '@/types/convert';

interface ConvertConfirmModalProps {
  from: Currency;
  to: Currency;
  fromAmount: number;
  quote: ConversionQuote;
  secondsToRefresh: number;
  isStale: boolean;
  onConfirm: () => Promise<{ fromAmount: number; toAmount: number }>;
  onCancel: () => void;
}

function formatFee(feeBps: number): string {
  return `${(feeBps / 100).toFixed(1)}%`;
}

export default function ConvertConfirmModal({
  from,
  to,
  fromAmount,
  quote,
  secondsToRefresh,
  isStale,
  onConfirm,
  onCancel,
}: ConvertConfirmModalProps) {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ fromAmount: number; toAmount: number } | null>(null);
  const urgent = secondsToRefresh <= 3;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onConfirm();
      setSuccess(result);
    } catch (err: any) {
      setError(err?.message || 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-[var(--overlay)] z-40 animate-backdrop-in"
        onClick={success ? undefined : onCancel}
      />

      {/* ── Modal ── */}
      <div
        className={`
          fixed z-50 bg-[var(--bg-elevated)] border border-[var(--border)]
          animate-modal-in
          ${isMobile
            ? 'bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md'
          }
        `}
      >
        {success ? (
          <ConversionSuccessCard from={from} to={to} fromAmount={success.fromAmount} toAmount={success.toAmount} />
        ) : (
          <>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Confirm Conversion</h3>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">You pay</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] tabular">
                  {fromAmount.toLocaleString()} {from}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">You receive</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] tabular">
                  {quote.toAmount.toFixed(6)} {to}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Rate</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] tabular">
                  1 {from} = {quote.effectiveRate.toFixed(6)} {to}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Fee</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] tabular">
                  {formatFee(quote.feeBps)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Quote expires in</span>
                <span className="text-sm font-semibold tabular" style={{ color: urgent ? 'var(--warning)' : 'var(--text-primary)' }}>
                  {secondsToRefresh}s
                </span>
              </div>
            </div>

            {/* ── Urgency warning ── */}
            {urgent && (
              <div className="rounded-lg bg-[var(--accent-muted)] border border-[var(--accent)]/30 p-3 mb-4">
                <p className="text-xs text-[var(--text-primary)]">
                  Quote expiring — confirm now or refresh for a fresh rate.
                </p>
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <p className="text-sm text-loss font-medium mb-4">{error}</p>
            )}

            {/* ── Buttons ── */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity duration-150 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing
                  </span>
                ) : 'Confirm'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}