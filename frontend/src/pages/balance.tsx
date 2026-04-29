// pages/balance.tsx
// ── BaneTrading — Balance / Funds hub (Binance/Bybit standard) ──

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ArrowDownToLine, ArrowUpFromLine, RefreshCw,
  Wallet, TrendingUp, TrendingDown, Eye, EyeOff,
  Clock, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

import { AuthenticatedShell }         from '@/components/layout/AuthenticatedShell';
import { withAuth }                   from '@/components/layout/withAuth';
import { BalanceHero }                from '@/components/funds/BalanceHero';
import { TransactionHistoryTable }    from '@/components/funds/TransactionHistoryTable';
import { DepositModal }               from '@/components/funds/DepositModal';
import { WithdrawModal }              from '@/components/funds/WithdrawModal';
import { useDeposit }                 from '@/hooks/useDeposit';
import { useWithdraw }                from '@/hooks/useWithdraw';
import { useBalance }                 from '@/hooks/useBalance';
import { useResponsive }              from '@/hooks/useResponsive';

const BRAND = 'BaneTrading';
const PAGE_SIZE = 20;

// ── Balance stat card ──
interface StatCardProps {
  label:      string;
  value:      string;
  sub?:       string;
  icon:       JSX.Element;
  tone:       'accent' | 'success' | 'warning' | 'info' | 'neutral';
  gain?:      boolean | null;
  skeleton?:  boolean;
}

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)'  },
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)'    },
  neutral: { bg: 'var(--bg-elevated)',   color: 'var(--text-muted)' },
};

function StatCard({ label, value, sub, icon, tone, gain, skeleton }: StatCardProps): JSX.Element {
  const ts = TONE_STYLES[tone];
  if (skeleton) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 animate-pulse" style={{ background: 'var(--bg-muted)' }}>
        <div className="h-9 w-9 rounded-xl bg-[var(--bg-card-hover)]" />
        <div className="h-3 w-20 rounded bg-[var(--bg-card-hover)]" />
        <div className="h-6 w-28 rounded bg-[var(--bg-card-hover)]" />
      </div>
    );
  }
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-4 transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]"
      style={{ background: 'var(--bg-muted)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: ts.bg, color: ts.color }}>
          {icon}
        </div>
        {gain !== null && gain !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${gain ? 'text-gain' : 'text-loss'}`}>
            {gain ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
        <p className="tabular mt-0.5 text-xl font-extrabold text-[var(--text-primary)]">{value}</p>
        {sub && <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{sub}</p>}
      </div>
    </div>
  );
}

// ── Quick action button ──
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
      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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

// ── Transaction status pill ──
type TxStatus = 'pending' | 'approved' | 'rejected' | 'processing';

const TX_STATUS_STYLES: Record<TxStatus, { bg: string; text: string; border: string; icon: JSX.Element }> = {
  pending:    { bg: 'var(--warning-muted)', text: 'var(--warning)', border: 'var(--warning)', icon: <Clock className="h-3 w-3" />         },
  approved:   { bg: 'var(--success-muted)', text: 'var(--success)', border: 'var(--success)', icon: <CheckCircle2 className="h-3 w-3" />   },
  rejected:   { bg: 'var(--danger-muted)',  text: 'var(--danger)',  border: 'var(--danger)',  icon: <XCircle className="h-3 w-3" />         },
  processing: { bg: 'var(--info-muted)',    text: 'var(--info)',    border: 'var(--info)',    icon: <Loader2 className="h-3 w-3 animate-spin" /> },
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

function BalancePage(): JSX.Element {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { balance, isLoading: isBalLoading } = useBalance();

  const [depositOpen,  setDepositOpen]  = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [hideBalance,  setHideBalance]  = useState(false);
  const [limit, setLimit]               = useState(PAGE_SIZE);
  const [isLoadingMore, setLoadingMore] = useState(false);

  const {
    deposits,
    total:    totalDeposits,
    isLoading: isDepositsLoading,
  } = useDeposit(limit, 0);

  const {
    withdrawals,
    total:    totalWithdrawals,
    isLoading: isWithdrawalsLoading,
  } = useWithdraw(limit, 0);

  const isLoading = isDepositsLoading || isWithdrawalsLoading;
  const hasMore   = useMemo(
    () => deposits.length + withdrawals.length < totalDeposits + totalWithdrawals,
    [deposits.length, withdrawals.length, totalDeposits, totalWithdrawals],
  );

  // ── Sync ?action=deposit|withdraw query (from QuickActions on dashboard) ──
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

  // Masked balance display
  const maskedValue = (val: string) => hideBalance ? '••••••' : val;

  // Total activity count
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

            {/* Action row */}
            <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              {/* Hide/show balance */}
              <button
                type="button"
                onClick={() => setHideBalance((h) => !h)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                style={{ color: 'var(--text-muted)' }}
                aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              >
                {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>

              {/* Deposit */}
              <QuickBtn
                icon={<ArrowDownToLine className="h-4 w-4" />}
                label="Deposit"
                tone="accent"
                onClick={() => setDepositOpen(true)}
              />

              {/* Withdraw */}
              <QuickBtn
                icon={<ArrowUpFromLine className="h-4 w-4" />}
                label="Withdraw"
                tone="danger"
                onClick={() => setWithdrawOpen(true)}
              />
            </div>
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total balance"
              value={maskedValue(balance != null ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—')}
              sub="USDT equivalent"
              icon={<Wallet className="h-4 w-4" />}
              tone="accent"
              skeleton={isBalLoading}
            />
            <StatCard
              label="Total deposited"
              value={maskedValue(totalDeposits > 0 ? `${totalDeposits} txns` : '—')}
              sub="All time"
              icon={<ArrowDownToLine className="h-4 w-4" />}
              tone="success"
              gain
              skeleton={isDepositsLoading}
            />
            <StatCard
              label="Total withdrawn"
              value={maskedValue(totalWithdrawals > 0 ? `${totalWithdrawals} txns` : '—')}
              sub="All time"
              icon={<ArrowUpFromLine className="h-4 w-4" />}
              tone="warning"
              gain={false}
              skeleton={isWithdrawalsLoading}
            />
            <StatCard
              label="Activity"
              value={maskedValue(totalTx > 0 ? `${totalTx} total` : '—')}
              sub="Deposits + withdrawals"
              icon={<RefreshCw className="h-4 w-4" />}
              tone="info"
              skeleton={isLoading}
            />
          </div>

          {/* ── Balance hero (existing component) ── */}
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

      {/* ── Modals — rendered at root level, outside AuthenticatedShell ── */}
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
    </>
  );
}

export default withAuth(BalancePage);
