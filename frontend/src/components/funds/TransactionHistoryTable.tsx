// components/funds/TransactionHistoryTable.tsx
// ── Combined deposit/withdrawal history — Binance/Bybit standard ──
// Desktop: full table  |  Mobile: card stack
//
// BALANCE FIX:
// 1. WithdrawalRecord now exposes `netAmount` and `networkFee`.
// 2. Amount column shows gross deducted + net received on separate lines for withdrawals.
// 3. UnifiedRow carries netAmount so the display can show real received value.

import { useMemo, useState }      from 'react';
import {
  ArrowDownLeft, ArrowUpRight, ExternalLink,
  FileText, Inbox, ChevronDown,
} from 'lucide-react';
import { Button }   from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn }       from '@/lib/cn';
import { resolveMediaUrl }                          from '@/lib/media';
import { formatAmount, formatRelativeTime, formatDate } from '@/lib/format';
import { CoinNetworkMap }                           from '@/types/funds';
import { useResponsive }                            from '@/hooks/useResponsive';
import type { DepositRecord, FundsStatus, WithdrawalRecord } from '@/types/funds';

// ── Types ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'deposits' | 'withdrawals';

interface UnifiedRow {
  id:         string;
  type:       'deposit' | 'withdrawal';
  amount:     number;
  netAmount?: number;  // BALANCE FIX: net amount user receives on withdrawal
  networkFee?: number;
  currency:   string;
  network:    string;
  status:     FundsStatus;
  createdAt:  string;
  proofPath?: string;
  toAddress?: string;
  txHash?:    string;
}

export interface TransactionHistoryTableProps {
  deposits:       DepositRecord[];
  withdrawals:    WithdrawalRecord[];
  isLoading:      boolean;
  hasMore:        boolean;
  onLoadMore:     () => void;
  isLoadingMore?: boolean;
}

// ── Status pill ──────────────────────────────────────────────────────────────

const STATUS_VARS: Record<FundsStatus, { border: string; bg: string; text: string }> = {
  pending:  { border: 'var(--warning)', bg: 'var(--warning-muted)', text: 'var(--warning)' },
  approved: { border: 'var(--success)', bg: 'var(--success-muted)', text: 'var(--success)' },
  rejected: { border: 'var(--danger)',  bg: 'var(--danger-muted)',  text: 'var(--danger)'  },
};

function StatusPill({ status }: { status: FundsStatus }): JSX.Element {
  const s = STATUS_VARS[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5
                 text-[10px] font-semibold uppercase tracking-wider capitalize"
      style={{ borderColor: s.border, background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

// ── Type icon ────────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: UnifiedRow['type'] }): JSX.Element {
  if (type === 'deposit') {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success-muted)] text-[var(--success)]">
        <ArrowDownLeft className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--danger-muted)] text-[var(--danger)]">
      <ArrowUpRight className="h-4 w-4" />
    </span>
  );
}

// ── Amount cell — BALANCE FIX: shows net for withdrawals ────────────────────

function AmountCell({ row }: { row: UnifiedRow }): JSX.Element {
  if (row.type === 'deposit') {
    return (
      <span className="tabular text-sm font-semibold text-gain">
        +{formatAmount(row.amount, row.currency)}
      </span>
    );
  }
  // Withdrawal: show gross deducted; net received as sub-line if fee > 0
  const hasFee = typeof row.networkFee === 'number' && row.networkFee > 0;
  return (
    <div className="flex flex-col">
      <span className="tabular text-sm font-semibold text-loss">
        −{formatAmount(row.amount, row.currency)}
      </span>
      {hasFee && typeof row.netAmount === 'number' && (
        <span className="tabular text-[10px] text-[var(--text-muted)]">
          Net: {formatAmount(row.netAmount, row.currency)}
        </span>
      )}
    </div>
  );
}

// ── Action / proof cell ──────────────────────────────────────────────────────

function ActionCell({ row }: { row: UnifiedRow }): JSX.Element {
  if (row.type === 'deposit' && row.proofPath) {
    const url = resolveMediaUrl(row.proofPath);
    return (
      <a
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-[var(--accent)]
                   hover:text-[var(--accent-hover)] hover:underline transition-colors"
      >
        <FileText className="h-3.5 w-3.5" />
        Proof
      </a>
    );
  }
  if (row.type === 'withdrawal' && row.txHash) {
    return (
      <span
        className="inline-flex items-center gap-1 max-w-[140px] truncate text-xs text-[var(--text-secondary)]"
        title={row.txHash}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <span className="font-mono truncate">{row.txHash}</span>
      </span>
    );
  }
  return <span className="text-xs text-[var(--text-muted)]">—</span>;
}

// ── Main component ───────────────────────────────────────────────────────────

export function TransactionHistoryTable({
  deposits,
  withdrawals,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore = false,
}: TransactionHistoryTableProps): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all');
  const { isMobile }        = useResponsive();

  const rows: UnifiedRow[] = useMemo(() => {
    const d: UnifiedRow[] = deposits.map((x) => ({
      id:        x._id,
      type:      'deposit',
      amount:    x.amount,
      currency:  x.currency,
      network:   CoinNetworkMap.label(x.network as any),
      status:    x.status,
      createdAt: x.createdAt,
      proofPath: x.proofFilePath,
    }));

    // BALANCE FIX: carry netAmount and networkFee for withdrawal display
    const w: UnifiedRow[] = withdrawals.map((x) => ({
      id:         x._id,
      type:       'withdrawal',
      amount:     x.amount,
      netAmount:  x.netAmount,
      networkFee: x.networkFee,
      currency:   x.currency,
      network:    CoinNetworkMap.label(x.network as any),
      status:     x.status,
      createdAt:  x.createdAt,
      toAddress:  x.toAddress,
      txHash:     x.txHash,
    }));

    const combined = [...d, ...w].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (filter === 'deposits')    return combined.filter((r) => r.type === 'deposit');
    if (filter === 'withdrawals') return combined.filter((r) => r.type === 'withdrawal');
    return combined;
  }, [deposits, withdrawals, filter]);

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
    >
      {/* ── Header / filter tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div className="relative flex items-center">
          {(['all', 'deposits', 'withdrawals'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'relative px-3 h-9 text-sm font-medium capitalize',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:rounded',
                filter === f
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              {f}
              {filter === f && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent)]"
                />
              )}
            </button>
          ))}
        </div>
        <span className="text-[11px] tabular text-[var(--text-muted)]">
          {isLoading ? '…' : `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState filter={filter} />
        ) : isMobile ? (
          <MobileCards rows={rows} />
        ) : (
          <DesktopTable rows={rows} />
        )}
      </div>

      {/* ── Load more ── */}
      {hasMore && rows.length > 0 && (
        <div className="border-t border-[var(--border)] px-5 py-4 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={onLoadMore}
            loading={isLoadingMore}
            leadingIcon={!isLoadingMore ? <ChevronDown className="h-4 w-4" /> : undefined}
          >
            Load more
          </Button>
        </div>
      )}
    </section>
  );
}

// ── Desktop table ────────────────────────────────────────────────────────────

function DesktopTable({ rows }: { rows: UnifiedRow[] }): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['Type', 'Amount', 'Coin / Network', 'Status', 'Date', 'Ref'].map((h) => (
              <th
                key={h}
                className={cn(
                  'py-2.5 pr-4 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]',
                  h === 'Ref' ? 'text-right' : 'text-left',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[var(--border-subtle)] transition-colors duration-100 hover:bg-[var(--hover-bg)]"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <TypeIcon type={row.type} />
                  <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                    {row.type}
                  </span>
                </div>
              </td>
              {/* BALANCE FIX: amount cell with net sub-line for withdrawals */}
              <td className="py-3 pr-4">
                <AmountCell row={row} />
              </td>
              <td className="py-3 pr-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-0.5 text-[11px]">
                  <span className="font-semibold text-[var(--text-primary)]">{row.currency}</span>
                  <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
                  <span className="text-[var(--text-secondary)]">{row.network}</span>
                </span>
              </td>
              <td className="py-3 pr-4"><StatusPill status={row.status} /></td>
              <td className="py-3 pr-4 text-xs text-[var(--text-muted)]" title={formatDate(row.createdAt)}>
                {formatRelativeTime(row.createdAt)}
              </td>
              <td className="py-3 pr-4 text-right"><ActionCell row={row} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Mobile cards ─────────────────────────────────────────────────────────────

function MobileCards({ rows }: { rows: UnifiedRow[] }): JSX.Element {
  return (
    <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
      {rows.map((row) => (
        <li key={row.id} className="py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <TypeIcon type={row.type} />
              <div className="min-w-0">
                <div className="text-sm font-medium capitalize text-[var(--text-primary)]">{row.type}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {row.currency} · {row.network} ·{' '}
                  <span title={formatDate(row.createdAt)}>{formatRelativeTime(row.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <AmountCell row={row} />
              <StatusPill status={row.status} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-end">
            <ActionCell row={row} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-4 py-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full animate-pulse bg-[var(--bg-muted)]" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 animate-pulse rounded-md bg-[var(--bg-muted)]" />
              <Skeleton className="h-2.5 w-36 animate-pulse rounded-md bg-[var(--bg-muted)]" />
            </div>
          </div>
          <Skeleton className="h-4 w-20 animate-pulse rounded-md bg-[var(--bg-muted)]" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: Filter }): JSX.Element {
  const heading =
    filter === 'deposits'    ? 'No deposits yet'
  : filter === 'withdrawals' ? 'No withdrawals yet'
  :                            'No transactions yet';

  const body =
    filter === 'deposits'    ? 'Tap Deposit above to fund your account.'
  : filter === 'withdrawals' ? 'Your withdrawal requests will appear here.'
  :                            'Deposits and withdrawals will appear here once you make them.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-muted)]">
        <Inbox className="h-6 w-6 text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">{heading}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{body}</p>
      </div>
    </div>
  );
}