// components/trade/PairsBar.tsx
// ── PAIRS BAR ──
// Three tabs (Crypto / Forex / Metals) with a horizontally scrollable pill row
// of available pairs underneath. Clicking a pill selects the pair.

import { useMemo } from 'react';
import type { PairClass, TradingPair, TradingPairsResponse } from '@/types/trade';

interface PairsBarProps {
  pairs: TradingPairsResponse;
  activeClass: PairClass;
  activeSymbol: string;
  onClassChange: (c: PairClass) => void;
  onSelectPair: (pair: TradingPair) => void;
}

const TABS: Array<{ key: PairClass; label: string }> = [
  { key: 'crypto', label: 'Crypto' },
  { key: 'forex',  label: 'Forex' },
  { key: 'metals', label: 'Metals' },
];

export function PairsBar({
  pairs,
  activeClass,
  activeSymbol,
  onClassChange,
  onSelectPair,
}: PairsBarProps): JSX.Element {
  const visiblePairs = useMemo<TradingPair[]>(() => {
    if (activeClass === 'crypto') return pairs.crypto;
    if (activeClass === 'forex')  return pairs.forex;
    return pairs.metals;
  }, [pairs, activeClass]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 sm:p-4">
      {/* Tab row */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        {TABS.map((tab) => {
          const isActive = activeClass === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onClassChange(tab.key)}
              className={
                isActive
                  ? 'rounded-lg bg-[var(--accent-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)] border border-[var(--accent)] transition-colors duration-150'
                  : 'rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors duration-150'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pill row — horizontally scrollable */}
      <div className="flex flex-nowrap gap-2 overflow-x-auto pt-3 -mx-1 px-1 scrollbar-thin">
        {visiblePairs.length === 0 && (
          <span className="text-xs text-[var(--text-muted)] py-1.5">No pairs available.</span>
        )}
        {visiblePairs.map((p) => {
          const isActive = p.symbol === activeSymbol;
          return (
            <button
              key={p.symbol}
              type="button"
              onClick={() => onSelectPair(p)}
              className={
                isActive
                  ? 'shrink-0 inline-flex items-center rounded-full border border-[var(--accent)] bg-[var(--accent-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] tabular transition-colors duration-150 active:scale-[0.98]'
                  : 'shrink-0 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] tabular transition-colors duration-150 active:scale-[0.98]'
              }
            >
              {p.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}