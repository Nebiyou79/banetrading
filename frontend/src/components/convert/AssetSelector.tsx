// components/convert/AssetSelector.tsx
// ── ASSET SELECTOR DROPDOWN ──

'use client';

import React, { useState, useRef, useEffect } from 'react';
import CoinIcon from '@/components/markets/CoinIcon';
import type { Currency } from '@/types/convert';

interface AssetSelectorProps {
  value: Currency | null;
  onChange: (currency: Currency) => void;
  balances: Record<string, number>;
  disabledCurrency?: Currency | null;
}

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USDT', label: 'Tether' },
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
  { value: 'SOL', label: 'Solana' },
  { value: 'BNB', label: 'BNB' },
  { value: 'XRP', label: 'XRP' },
];

export default function AssetSelector({
  value,
  onChange,
  balances,
  disabledCurrency,
}: AssetSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = CURRENCIES.find(c => c.value === value);
  const available = value ? (balances[value] || 0) : 0;

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
      >
        {selected ? (
          <>
            <CoinIcon iconUrl={null} symbol={selected.value} size={36} />
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-[var(--text-primary)]">{selected.value}</div>
              <div className="text-xs text-[var(--text-muted)]">{selected.label}</div>
            </div>
            <span className="text-xs text-[var(--text-muted)] tabular">
              Available: {available.toLocaleString()}
            </span>
          </>
        ) : (
          <span className="text-sm text-[var(--text-muted)]">Select asset</span>
        )}
        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg z-30 max-h-64 overflow-y-auto animate-modal-in">
          {CURRENCIES.map(c => {
            const isSelected = c.value === value;
            const isDisabled = c.value === disabledCurrency;
            return (
              <button
                key={c.value}
                type="button"
                disabled={isDisabled}
                onClick={() => { onChange(c.value); setOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150
                  ${isDisabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-[var(--hover-bg)]'
                  }
                  ${isSelected ? 'bg-[var(--accent-muted)]' : ''}
                `}
              >
                <CoinIcon iconUrl={null} symbol={c.value} size={28} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{c.value}</div>
                  <div className="text-xs text-[var(--text-muted)]">{c.label}</div>
                </div>
                <span className="text-xs text-[var(--text-muted)] tabular">
                  {balances[c.value]?.toLocaleString() || '0'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}