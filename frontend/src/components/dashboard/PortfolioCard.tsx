// components/dashboard/PortfolioCard.tsx
// ── Big balance number + 24h change + 7-day sparkline + hide toggle ──

import { useMemo, useState } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/lib/cn';
import { formatUsd, formatSignedUsd, formatSignedPercent } from '@/lib/format';
import { useCountUp } from '@/hooks/useCountUp';
import type { Portfolio } from '@/types/profile';

export interface PortfolioCardProps {
  portfolio: Portfolio | null;
  isLoading: boolean;
}

/** Deterministic pseudo-7-day sparkline seeded from the current balance so it
 *  doesn't jitter on re-render. Replace with real history once the trade
 *  history endpoint is available. */
function makeSparklinePoints(balance: number): number[] {
  const points: number[] = [];
  const seed = Math.max(1, balance || 1);
  for (let i = 0; i < 28; i += 1) {
    const noise = Math.sin(i * 1.7 + seed * 0.001) * 0.04
                + Math.cos(i * 0.9) * 0.02
                + ((i / 28) - 0.5) * 0.08;
    points.push(seed * (1 + noise));
  }
  return points;
}

function Sparkline({ points, positive }: { points: number[]; positive: boolean }): JSX.Element {
  const width = 320;
  const height = 80;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return { x, y };
  });
  const path = coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  const stroke = positive ? 'var(--success)' : 'var(--danger)';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PortfolioCard({ portfolio, isLoading }: PortfolioCardProps): JSX.Element {
  const [hidden, setHidden] = useState(false);
  const total = portfolio?.totalBalanceUsd ?? 0;
  const change = portfolio?.change24h ?? { absolute: 0, percent: 0 };
  const animated = useCountUp(total, { duration: 350, decimals: 2 });
  const positive = (change.percent ?? 0) >= 0;

  const points = useMemo(() => makeSparklinePoints(total), [total]);

  return (
    <div className="rounded-card border border-border bg-elevated p-5 shadow-card transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-text-muted">Total balance</div>
          {isLoading ? (
            <Skeleton className="mt-2 h-10 w-60" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold tabular-nums text-text-primary">
                {hidden ? '••••••••' : formatUsd(animated)}
              </span>
              <span className="text-xs font-medium text-text-muted">USD</span>
            </div>
          )}
          {!isLoading && (
            <div className="mt-2 flex items-center gap-2">
              <Pill tone={positive ? 'success' : 'danger'} size="sm" leadingIcon={
                positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
              }>
                {formatSignedPercent(change.percent)}
              </Pill>
              <span className="text-xs tabular-nums text-text-secondary">
                {formatSignedUsd(change.absolute)} 24h
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setHidden((v) => !v)}
          aria-label={hidden ? 'Show balance' : 'Hide balance'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-button border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className={cn('mt-4 h-20 -mx-1', isLoading && 'opacity-30')}>
        <Sparkline points={points} positive={positive} />
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-text-muted">
        <span>7 days</span>
        <span>Now</span>
      </div>
    </div>
  );
}