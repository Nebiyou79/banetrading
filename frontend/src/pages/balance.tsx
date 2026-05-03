// pages/balance.tsx
// ── BaneTrading — Balance / Funds hub (Binance/Bybit standard) ──
//
// BALANCE FIX:
// 1. Stats grid shows per-asset balances (available + locked) instead of
//    misleading transaction counts.
// 2. Reads balances and lockedBalances from useBalance (multi-asset).
// 3. "Total balance" card shows sum of all available balances in USDT-equivalent.
// 4. Individual asset cards show available amount with a "locked" sub-line when > 0.

import { useEffect, useMemo, useState } from 'react';
import Head         from 'next/head';
import { useRouter } from 'next/router';
import {
  ArrowDownToLine, ArrowUpFromLine, RefreshCw,
  Wallet, Eye, EyeOff, Lock,
  Clock, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

import { AuthenticatedShell }      from '@/components/layout/AuthenticatedShell';
import { withAuth }                from '@/components/layout/withAuth';
import { BalanceHero }             from '@/components/funds/BalanceHero';
import { TransactionHistoryTable } from '@/components/funds/TransactionHistoryTable';
import { DepositModal }            from '@/components/funds/DepositModal';
import { WithdrawModal }           from '@/components/funds/WithdrawModal';
import { useDeposit }              from '@/hooks/useDeposit';
import { useWithdraw }             from '@/hooks/useWithdraw';
import { useBalance }              from '@/hooks/useBalance';
import { useResponsive }           from '@/hooks/useResponsive';
import { formatAmount }            from '@/lib/format';
import { COINS }                   from '@/types/funds';
import type { Coin }               from '@/types/funds';

const BRAND     = 'BaneTrading';
const PAGE_SIZE = 20;

// ── Coin brand colours (kept local — not semantic) ──────────────────────────
const COIN_ACCENT: Record<Coin, string> = {
  USDT: 'var(--accent)',
  BTC:  'var(--warning)',
  ETH:  'var(--info)',
};

// ── Asset balance stat card ──────────────────────────────────────────────────
interface AssetCardProps {
  coin:       Coin;
  available:  number;
  locked:     number;
  hidden:     boolean;
  skeleton?:  boolean;
}

function AssetCard({ coin, available, locked, hidden, skeleton }: AssetCardProps): JSX.Element {
  const accent = COIN_ACCENT[coin];
  if (skeleton) {
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 animate-pulse"
        style={{ background: 'var(--bg-muted)' }}
      >
        <div className="h-8 w-8 rounded-xl bg-[var(--bg-card-hover)]" />
        <div className="h-3 w-12 rounded bg-[var(--bg-card-hover)]" />
        <div className="h-6 w-24 rounded bg-[var(--bg-card-hover)]" />
      </div>
    );
  }
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4
                 transition-all duration-150 hover:border-[var(--border-strong)]
                 hover:bg-[var(--bg-card-hover)]"
      style={{ background: 'var(--bg-muted)' }}
    >
      {/* Coin label pill */}
      <div
        className="inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-bold tracking-wide self-start"
        style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)`, color: accent }}
      >
        {coin}
      </div>

      {/* Available amount */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Available
        </p>
        <p className={`tabular mt-0.5 text-xl font-extrabold text-[var(--text-primary)] ${hidden ? 'blur-sm select-none' : ''}`}>
          {hidden ? '••••••' : formatAmount(available, coin)}
        </p>
      </div>

      {/* Locked sub-line — only shown when > 0 */}
      {locked > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: 'var(--warning-muted)' }}>
          <Lock className="h-3 w-3 shrink-0" style={{ color: 'var(--warning)' }} />
          <span className={`tabular text-[11px] font-medium ${hidden ? 'blur-sm select-none' : ''}`} style={{ color: 'var(--warning)' }}>
            {hidden ? '••••' : formatAmount(locked, coin)} locked
          </span>
        </div>
      )}
    </div>
  );
}

// ── Total balance summary card ───────────────────────────────────────────────
function TotalCard({
  balance, lockedTotal, hidden, skeleton,
}: {
  balance: number;
  lockedTotal: number;
  hidden: boolean;
  skeleton?: boolean;
}): JSX.Element {
  if (skeleton) {
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 animate-pulse"
        style={{ background: 'var(--bg-muted)' }}
      >
        <div className="h-8 w-8 rounded-xl bg-[var(--bg-card-hover)]" />
        <div className="h-3 w-20 rounded bg-[var(--bg-card-hover)]" />
        <div className="h-6 w-28 rounded bg-[var(--bg-card-hover)]" />
      </div>
    );
  }
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-[var(--accent)] p-4
                 transition-all duration-150 hover:bg-[var(--bg-card-hover)]"
      style={{ background: 'var(--accent-muted)' }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
      >
        <Wallet className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Total available
        </p>
        <p className={`tabular mt-0.5 text-xl font-extrabold text-[var(--text-primary)] ${hidden ? 'blur-sm select-none' : ''}`}>
          {hidden ? '••••••' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">USDT equivalent</p>
      </div>
      {lockedTotal > 0 && (
        <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: 'var(--warning-muted)' }}>
          <Lock className="h-3 w-3 shrink-0" style={{ color: 'var(--warning)' }} />
          <span className={`tabular text-[11px] font-medium ${hidden ? 'blur-sm select-none' : ''}`} style={{ color: 'var(--warning)' }}>
            {hidden ? '••••' : `$${lockedTotal.toFixed(2)}`} pending withdrawal
          </span>
        </div>
      )}
    </div>
  );
}

// ── Quick action button ──────────────────────────────────────────────────────
function QuickBtn({
  icon, label, tone, onClick, disabled,
}: {
  icon: JSX.Element;
  label: string;
  tone: 'accent' | 'danger' | 'neutral';
  onClick: () => void;
  disabled?: boolean;
}): JSX.Element {
  const bgMap: Record<string, string> = {
    accent:  'var(--accent)',
    danger:  'var(--danger)',
    neutral: 'var(--bg-elevated)',
  };
  const colorMap: Record<string, string> = {
    accent:  'var(--text-inverse)',
    danger:  'var(--text-inverse)',
    neutral: 'var(--text-secondary)',
  };
  const shadowMap: Record<string, string> = {
    accent:  '0 0 20px var(--accent-muted)',
    danger:  '0 0 20px var(--danger-muted)',
    neutral: 'none',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                 transition-all duration-150 hover:opacity-90
                 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: bgMap[tone],
        color:      colorMap[tone],
        boxShadow:  shadowMap[tone],
        border:     tone === 'neutral' ? '1px solid var(--border)' : 'none',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Transaction status pill ──────────────────────────────────────────────────
type TxStatus = 'pending' | 'approved' | 'rejected' | 'processing';

const TX_STATUS_STYLES: Record<TxStatus, { bg: string; text: string; border: string; icon: JSX.Element }> = {
  pending:    { bg: 'var(--warning-muted)', text: 'var(--warning)', border: 'var(--warning)', icon: <Clock className="h-3 w-3" />                     },
  approved:   { bg: 'var(--success-muted)', text: 'var(--success)', border: 'var(--success)', icon: <CheckCircle2 className="h-3 w-3" />               },
  rejected:   { bg: 'var(--danger-muted)',  text: 'var(--danger)',  border: 'var(--danger)',  icon: <XCircle className="h-3 w-3" />                     },
  processing: { bg: 'var(--info-muted)',    text: 'var(--info)',    border: 'var(--info)',    icon: <Loader2 className="h-3 w-3 animate-spin" />         },
};

export function TxStatusPill({ status }: { status: TxStatus }): JSX.Element {
  const s = TX_STATUS_STYLES[status] ?? TX_STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ background: s.bg, color: s.text, borderColor: `${s.border}40` }}
    >
      {s.icon}
      {status}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
function BalancePage(): JSX.Element {
  const router     = useRouter();
  const { isMobile } = useResponsive();

  // BALANCE FIX: read full multi-asset balances
  const {
    balance,
    balances,
    lockedBalances,
    isLoading: isBalLoading,
  } = useBalance();

  const [depositOpen,  setDepositOpen]  = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [hideBalance,  setHideBalance]  = useState(false);
  const [limit, setLimit]               = useState(PAGE_SIZE);
  const [isLoadingMore, setLoadingMore] = useState(false);

  const {
    deposits,
    total:     totalDeposits,
    isLoading: isDepositsLoading,
  } = useDeposit(limit, 0);

  const {
    withdrawals,
    total:     totalWithdrawals,
    isLoading: isWithdrawalsLoading,
  } = useWithdraw(limit, 0);

  const isLoading = isDepositsLoading || isWithdrawalsLoading;
  const hasMore   = useMemo(
    () => deposits.length + withdrawals.length < totalDeposits + totalWithdrawals,
    [deposits.length, withdrawals.length, totalDeposits, totalWithdrawals],
  );

  // ── Sync ?action=deposit|withdraw query ──
  useEffect(() => {
    if (!router.isReady) return;
    const action = router.query.action;
    if (action === 'deposit')  setTimeout(() => setDepositOpen(true), 0);
    if (action === 'withdraw') setTimeout(() => setWithdrawOpen(true), 0);
    if (action === 'deposit' || action === 'withdraw') {
      const { action: _drop, ...rest } = router.query;
      router.replace({ pathname: '/balance', query: rest }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query, router]);

  const handleLoadMore = async (): Promise<void> => {
    setLoadingMore(true);
    setLimit((x) => x + PAGE_SIZE);
    setTimeout(() => setLoadingMore(false), 400);
  };

  // BALANCE FIX: compute total locked in USDT-equivalent (simplified: only USDT locked tracked as USD)
  const lockedTotal = lockedBalances['USDT'] ?? 0;

  const totalTx = totalDeposits + totalWithdrawals;

  return (
    <>
      <Head>
        <title>Balance · {BRAND}</title>
        <meta name="description" content="Manage your BaneTrading funds — deposit, withdraw, and track transaction history." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">

          {/* ── Page header ── */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Funds
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Balance &amp; Transactions
              </h1>
            </div>

            <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <button
                type="button"
                onClick={() => setHideBalance((h) => !h)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                style={{ color: 'var(--text-muted)' }}
                aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <QuickBtn
                icon={<ArrowDownToLine className="h-4 w-4" />}
                label="Deposit"
                tone="accent"
                onClick={() => setDepositOpen(true)}
              />
              <QuickBtn
                icon={<ArrowUpFromLine className="h-4 w-4" />}
                label="Withdraw"
                tone="danger"
                onClick={() => setWithdrawOpen(true)}
              />
            </div>
          </div>

          {/* ── BALANCE FIX: Asset balance grid ── */}
          {/* Total card + one card per coin */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TotalCard
              balance={balance}
              lockedTotal={lockedTotal}
              hidden={hideBalance}
              skeleton={isBalLoading}
            />
            {COINS.map((c) => (
              <AssetCard
                key={c}
                coin={c}
                available={balances[c] ?? 0}
                locked={lockedBalances[c] ?? 0}
                hidden={hideBalance}
                skeleton={isBalLoading}
              />
            ))}
          </div>

          {/* ── Balance hero ── */}
          <BalanceHero
            onDeposit={() => setDepositOpen(true)}
            onWithdraw={() => setWithdrawOpen(true)}
          />

          {/* ── Transaction history ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Transaction history
              </p>
              {!isLoading && totalTx > 0 && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  {totalTx} total transaction{totalTx !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <TransactionHistoryTable
              deposits={deposits}
              withdrawals={withdrawals}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
              isLoadingMore={isLoadingMore}
            />
          </div>
        </div>
      </AuthenticatedShell>

      <DepositModal  open={depositOpen}  onClose={() => setDepositOpen(false)}  />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </>
  );
}

export default withAuth(BalancePage);