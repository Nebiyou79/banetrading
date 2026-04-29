// components/convert/ConvertForm.tsx
// ── CONVERSION FORM ──

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/hooks/useResponsive';
import { useUserBalances } from '@/hooks/useUserBalances';
import { useConversionQuote } from '@/hooks/useConversionQuote';
import { useExecuteConversion } from '@/hooks/useExecuteConversion';
import AssetSelector from './AssetSelector';
import QuoteCard from './QuoteCard';
import ConvertConfirmModal from './ConvertConfirmModal';
import type { Currency, ConversionQuote } from '@/types/convert';

const CURRENCIES: Currency[] = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

const PRICE_STEPS: Record<Currency, string> = {
  USDT: '0.01', BTC: '0.00000001', ETH: '0.000001',
  SOL: '0.0001', BNB: '0.0001', XRP: '0.0001',
};

export default function ConvertForm() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { balances } = useUserBalances();
  const executeMutation = useExecuteConversion();

  const [from, setFrom] = useState<Currency | null>(null);
  const [to, setTo] = useState<Currency | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const numericAmount = parseFloat(fromAmount) || 0;

  const {
    quote,
    isLoading: quoteLoading,
    isStale,
    secondsToRefresh,
    error: quoteError,
    refetch,
  } = useConversionQuote({ from, to, fromAmount: numericAmount });

  // ── Swap ──
  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    setFromAmount('');
  };

  // ── % chips ──
  const handlePercent = (pct: number) => {
    if (!from) return;
    const available = balances[from] || 0;
    setFromAmount((available * pct / 100).toString());
  };

  // ── Validation ──
  const available = from ? (balances[from] || 0) : 0;
  const disabled = !from || !to || from === to || numericAmount <= 0 ||
    numericAmount > available || quoteLoading || !quote;

  const balanceError = from && numericAmount > available
    ? `Insufficient ${from} balance. Available: ${available.toLocaleString()}`
    : null;

  const error = quoteError || balanceError;

  return (
    <>
      <div className={`rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6 space-y-5 ${isMobile ? '' : 'max-w-lg mx-auto'}`}>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Convert</h2>

        {/* ── From ── */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">From</label>
          <AssetSelector value={from} onChange={setFrom} balances={balances} disabledCurrency={to} />
          <div className="mt-2">
            <input
              type="number"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              placeholder="0.00"
              step={from ? PRICE_STEPS[from] : '0.01'}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] tabular text-lg font-medium outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors duration-150"
            />
          </div>
          {/* ── Percent chips ── */}
          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercent(pct)}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors duration-150 tabular"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* ── Swap button ── */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            className="rounded-full w-10 h-10 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--hover-bg)] transition-all duration-150 active:scale-95 group"
            aria-label="Swap currencies"
          >
            <svg
              className="w-5 h-5 text-[var(--text-secondary)] group-active:rotate-180 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* ── To ── */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">To</label>
          <AssetSelector value={to} onChange={setTo} balances={balances} disabledCurrency={from} />
          <div className="mt-2">
            <input
              type="text"
              readOnly
              value={quote ? quote.toAmount.toFixed(6) : ''}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] tabular text-lg font-medium outline-none cursor-default"
            />
          </div>
        </div>

        {/* ── Quote card ── */}
        <QuoteCard
          quote={quote}
          from={from}
          to={to}
          secondsToRefresh={secondsToRefresh}
          isStale={isStale}
          isLoading={quoteLoading}
          onRefresh={() => refetch()}
        />

        {/* ── Error ── */}
        {error && (
          <p className="text-sm text-loss font-medium">{error}</p>
        )}

        {/* ── Convert button ── */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowConfirm(true)}
          className={`
            w-full py-3 rounded-xl font-semibold text-base transition-all duration-150
            ${disabled
              ? 'bg-[var(--disabled)] text-[var(--disabled-text)] cursor-not-allowed'
              : 'bg-[var(--accent)] text-[var(--text-inverse)] hover:opacity-90 active:scale-[0.98]'
            }
          `}
        >
          Convert
        </button>
      </div>

      {/* ── Confirm modal ── */}
      {showConfirm && quote && from && to && (
        <ConvertConfirmModal
          from={from}
          to={to}
          fromAmount={numericAmount}
          quote={quote}
          secondsToRefresh={secondsToRefresh}
          isStale={isStale}
          onConfirm={async () => {
            const result = await executeMutation.mutateAsync({
              from, to, fromAmount: numericAmount, quotedRate: quote.marketRate,
            });
            setShowConfirm(false);
            setFromAmount('');
            return result;
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}