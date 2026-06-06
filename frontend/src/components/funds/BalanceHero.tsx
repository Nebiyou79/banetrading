// components/funds/BalanceHero.tsx
// ── Big balance display + Deposit / Withdraw CTAs — Binance/Bybit standard ──
//
// TOTAL BALANCE FIX:
// The headline figure now shows the true USD-equivalent total across ALL
// held assets (USDT + BTC×price + ETH×price + …), not just the raw USDT balance.
// Per-asset breakdown cards still show native amounts (e.g. "5.00 BTC").

import { useState }    from 'react';
import {
  Eye, EyeOff, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, TrendingDown, Wallet, ShieldAlert, Lock,
} from 'lucide-react';
import { Button }   from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn }       from '@/lib/cn';
import {
  formatUsd, formatSignedUsd, formatSignedPercent, formatAmount,
} from '@/lib/format';
import { useCountUp }      from '@/hooks/useCountUp';
import { useBalance }      from '@/hooks/useBalance';
import { useTotalBalance } from '@/hooks/useTotalBalance';
import { usePortfolio }    from '@/hooks/usePortfolio';
import { useResponsive }   from '@/hooks/useResponsive';
import { COINS }           from '@/types/funds';
import type { Coin }       from '@/types/funds';

export interface BalanceHeroProps {
  onDeposit:  () => void;
  onWithdraw: () => void;
}

export function BalanceHero({ onDeposit, onWithdraw }: BalanceHeroProps): JSX.Element {
  const { balances, lockedBalances, isFrozen, isLoading } = useBalance();

  // TOTAL BALANCE FIX: use price-aware total instead of raw USDT balance
  const { totalUsd, lockedTotalUsd, priceOf, isPriceLoading } = useTotalBalance();

  const { portfolio }  = usePortfolio();
  const { isMobile }   = useResponsive();
  const [hidden, setHidden] = useState(false);

  const isLoadingAny = isLoading || isPriceLoading;
  const animated     = useCountUp(totalUsd, { duration: 350, decimals: 2 });
  const change       = portfolio?.change24h ?? { absolute: 0, percent: 0 };
  const positive     = change.percent >= 0;

  // Show coins with any balance or locked amount
  const activeCoins = COINS.filter(
    (c) => (balances[c] ?? 0) > 0 || (lockedBalances[c] ?? 0) > 0,
  );

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6"
      style={{
        boxShadow: '0 4px 32px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.03) inset',
      }}
    >
      {/* Gradient accent blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

        {/* ── Left: balance figures ── */}
        <div className="flex flex-col gap-3">

          {/* Label row */}
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              Total balance
            </span>
            <button
              type="button"
              onClick={() => setHidden((v) => !v)}
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg
                         text-[var(--text-muted)] transition-colors duration-150
                         hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              {hidden
                ? <EyeOff className="h-3.5 w-3.5" />
                : <Eye    className="h-3.5 w-3.5" />}
            </button>
            {isFrozen && (
              <span
                className="inline-flex items-center gap-1 rounded-full border
                           border-[var(--danger)] bg-[var(--danger-muted)]
                           px-2 py-0.5 text-[10px] font-semibold uppercase
                           tracking-wider text-[var(--danger)]"
              >
                <ShieldAlert className="h-2.5 w-2.5" />
                Frozen
              </span>
            )}
          </div>

          {/* Total balance amount */}
          {isLoadingAny ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-64 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
              <Skeleton className="h-4  w-40 animate-pulse rounded-md  bg-[var(--bg-muted)]" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    'tabular text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl',
                    hidden && 'select-none blur-sm',
                  )}
                  aria-label={hidden ? 'Balance hidden' : undefined}
                >
                  {/* TOTAL BALANCE FIX: animated uses totalUsd (all coins converted) */}
                  {hidden ? '••••••••' : formatUsd(animated)}
                </span>
                <span className="mb-0.5 text-sm font-medium text-[var(--text-muted)]">USD</span>
              </div>

              {/* 24h change row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
                    'text-[11px] font-semibold tabular',
                    positive
                      ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]'
                      : 'border-[var(--danger)]  bg-[var(--danger-muted)]  text-[var(--danger)]',
                  )}
                >
                  {positive
                    ? <TrendingUp   className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />}
                  {formatSignedPercent(change.percent)}
                </span>
                <span className={cn('tabular text-xs font-medium', positive ? 'text-gain' : 'text-loss')}>
                  {formatSignedUsd(change.absolute)}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">24h</span>
              </div>

              {/* ── Per-asset breakdown ── */}
              {activeCoins.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {activeCoins.map((c) => {
                    const available    = balances[c] ?? 0;
                    const locked       = lockedBalances[c] ?? 0;
                    const usdValue     = available * (c === 'USDT' ? 1 : priceOf(c));
                    const showUsdValue = c !== 'USDT' && usdValue > 0;

                    return (
                      <div
                        key={c}
                        className="flex flex-col gap-0.5 rounded-xl border border-[var(--border)]
                                   bg-[var(--bg-muted)] px-3 py-2 min-w-[96px]"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                          {c}
                        </span>
                        {/* Native amount */}
                        <span className={cn('tabular text-sm font-bold text-[var(--text-primary)]', hidden && 'blur-sm select-none')}>
                          {hidden ? '••••' : formatAmount(available, c)}
                        </span>
                        {/* USD equivalent for non-USDT coins */}
                        {showUsdValue && !hidden && (
                          <span className="tabular text-[10px] text-[var(--text-muted)]">
                            ≈ {formatUsd(usdValue)}
                          </span>
                        )}
                        {/* Locked amount */}
                        {locked > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5 shrink-0" style={{ color: 'var(--warning)' }} />
                            <span
                              className={cn('tabular text-[10px]', hidden && 'blur-sm select-none')}
                              style={{ color: 'var(--warning)' }}
                              title="Pending withdrawal"
                            >
                              {hidden ? '••••' : formatAmount(locked, c)} locked
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: action buttons ── */}
        <div className={cn('flex gap-2', isMobile ? 'w-full flex-col' : 'flex-row items-center')}>
          <Button
            variant="primary"
            size="lg"
            leadingIcon={<ArrowDownToLine className="h-4 w-4" />}
            onClick={onDeposit}
            disabled={isFrozen}
            className={cn(isMobile && 'w-full')}
          >
            Deposit
          </Button>
          <Button
            variant="secondary"
            size="lg"
            leadingIcon={<ArrowUpFromLine className="h-4 w-4" />}
            onClick={onWithdraw}
            disabled={isFrozen || totalUsd <= 0}
            className={cn(isMobile && 'w-full')}
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* Frozen overlay banner */}
      {isFrozen && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-xl border
                     border-[var(--danger)] bg-[var(--danger-muted)]
                     px-4 py-2.5 text-xs text-[var(--danger)]"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-semibold">Account frozen.</span>{' '}
            Deposits and withdrawals are disabled. Contact support.
          </span>
        </div>
      )}
    </section>
  );
}