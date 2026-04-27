// components/dashboard/AssetsList.tsx
// ── Holdings list with mini-sparkline per asset ──

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatUsd, formatSignedPercent, formatAmount } from '@/lib/format';
import type { BalanceEntry, Portfolio } from '@/types/profile';

export interface AssetsListProps {
  portfolio: Portfolio | null;
  isLoading: boolean;
}

/*
 * Coin badge colors — brand-specific, intentionally hardcoded per asset.
 * These are the canonical brand colors for each coin and are not part of
 * the platform's design token set.
 */
const COIN_COLORS: Record<string, string> = {
  USDT: '#26A17B',
  BTC:  '#F7931A',
  ETH:  '#627EEA',
  SOL:  '#9945FF',
  BNB:  '#F0B90B',
  XRP:  '#23292F',
};

function coinColor(code: string): string {
  return COIN_COLORS[code.toUpperCase()] ?? 'var(--text-muted)';
}

/** Pseudo-stable per-asset mini-sparkline. Replace with real price data when available. */
function makeAssetSpark(seed: number, positive: boolean): number[] {
  const out: number[] = [];
  const dir = positive ? 1 : -1;
  for (let i = 0; i < 16; i += 1) {
    out.push(
      0.5
        + Math.sin(i * 0.7 + seed) * 0.18
        + Math.cos(i * 0.31 + seed) * 0.07
        + ((i / 15) - 0.5) * 0.18 * dir,
    );
  }
  return out;
}

function MiniSpark({
  points,
  positive,
}: {
  points: number[];
  positive: boolean;
}): JSX.Element {
  const w = 64;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = w / (points.length - 1);

  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / range) * (h - 2) - 1;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      {/*
       * Sparkline stroke:
       *   positive → var(--success)  green[400/500]
       *   negative → var(--error)    red[400/500]
       */}
      <path
        d={path}
        fill="none"
        stroke={positive ? 'var(--success)' : 'var(--error)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AssetsList({ portfolio, isLoading }: AssetsListProps): JSX.Element {
  const rows: Array<BalanceEntry & { changePercent: number }> = useMemo(() => {
    const list = portfolio?.balances ?? [];
    return list.map((b, i) => {
      const seed = b.currency.charCodeAt(0) + i * 7;
      const cp = ((seed % 13) - 6) / 1.5;
      return { ...b, changePercent: cp };
    });
  }, [portfolio]);

  const isEmpty = !isLoading && rows.length === 0;

  return (
    /*
     * Card shell:
     *   bg-[var(--card)]            → neutral[800] dark | white light
     *   border-[var(--border)]      → neutral[700] dark | neutral[200] light
     *   hover:border-[var(--primary-muted)] → subtle gold rim on hover
     */
    <div
      className="
        rounded-card border border-[var(--border)]
        bg-[var(--card)]
        shadow-lg h-full flex flex-col
        transition-all duration-200
        hover:border-[var(--primary-muted)]
      "
    >
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[var(--text-muted)]" />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Holdings
            </div>
            <h3 className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
              Your assets
            </h3>
          </div>
        </div>
        <span className="text-[11px] text-[var(--text-muted)]">
          {rows.length} {rows.length === 1 ? 'asset' : 'assets'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-2 py-2">
        {isLoading ? (
          <ul className="flex flex-col gap-1 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24" />
              </li>
            ))}
          </ul>
        ) : isEmpty ? (
          <div
            className="
              m-3 rounded-input
              border border-dashed border-[var(--border)]
              bg-[var(--surface)]/40
              p-5 text-center text-xs text-[var(--text-muted)]
            "
          >
            No holdings yet. Deposit funds to start trading.
          </div>
        ) : (
          <ul className="flex flex-col">
            {rows.map((row, idx) => {
              const positive = row.changePercent >= 0;
              const color    = coinColor(row.currency);
              const points   = makeAssetSpark(idx, positive);

              return (
                <li
                  key={row.currency}
                  className="
                    flex items-center justify-between gap-3 rounded-button px-3 py-2.5
                    hover:bg-[var(--hover-bg)]
                    transition-colors duration-150
                  "
                >
                  {/* Left: badge + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    >
                      {row.currency.slice(0, 3)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {row.currency}
                      </div>
                      <div className="text-[11px] tabular-nums text-[var(--text-muted)] truncate">
                        {formatAmount(row.amount, row.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Right: sparkline + value + change */}
                  <div className="flex items-center gap-3">
                    <MiniSpark points={points} positive={positive} />
                    <div className="flex flex-col items-end gap-0.5 min-w-[88px]">
                      <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                        {formatUsd(row.usdValue)}
                      </span>
                      {/*
                       * Change badge:
                       *   positive → text-[var(--success)] green
                       *   negative → text-[var(--error)]   red
                       */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-0.5 text-[11px] tabular-nums',
                          positive ? 'text-[var(--success)]' : 'text-[var(--error)]',
                        )}
                      >
                        {positive
                          ? <TrendingUp   className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />
                        }
                        {formatSignedPercent(row.changePercent)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
