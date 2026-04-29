// components/funds/WithdrawModal.tsx
// ── Single-step withdrawal form — Binance/Bybit standard ──
// Mobile  → bottom sheet (rounded-t-2xl, slides up)
// Desktop → centered dialog (animate-modal-in)

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button }               from '@/components/ui/Button';
import { Spinner }              from '@/components/ui/Spinner';
import { CoinIcon }             from './CoinIcon';
import { IrreversibleWarning }  from './NetworkWarning';
import { cn }                   from '@/lib/cn';
import { formatAmount }         from '@/lib/format';
import { validateAddressForNetwork } from '@/lib/addressValidation';
import {
  COINS,
  CoinNetworkMap,
  WITHDRAW_NETWORKS_FOR_COIN,
} from '@/types/funds';
import type { Coin, WithdrawNetwork } from '@/types/funds';
import { useBalance }       from '@/hooks/useBalance';
import { useNetworkFees }   from '@/hooks/useNetworkFees';
import { useWithdraw }      from '@/hooks/useWithdraw';
import { useResponsive }    from '@/hooks/useResponsive';
import type { NormalizedApiError } from '@/services/apiClient';

export interface WithdrawModalProps {
  open:         boolean;
  onClose:      () => void;
  initialCoin?: Coin | null;
}

const QUICK_FILL = [25, 50, 75, 100] as const;

function decimalsForCoin(coin: Coin): number {
  return coin === 'USDT' ? 2 : 8;
}

export function WithdrawModal({
  open,
  onClose,
  initialCoin = null,
}: WithdrawModalProps): JSX.Element | null {
  const { isMobile }                     = useResponsive();
  const { balance }                      = useBalance();
  const { fees, isLoading: feesLoading } = useNetworkFees();
  const { submit, isSubmitting }         = useWithdraw();

  const [coin, setCoin]           = useState<Coin>(initialCoin ?? 'USDT');
  const [network, setNetwork]     = useState<WithdrawNetwork>(WITHDRAW_NETWORKS_FOR_COIN[initialCoin ?? 'USDT'][0]);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount]       = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  /* Reset on (re)open */
  useEffect(() => {
    if (open) {
      const c: Coin = initialCoin ?? 'USDT';
      setCoin(c);
      setNetwork(WITHDRAW_NETWORKS_FOR_COIN[c][0]);
      setToAddress('');
      setAmount('');
      setServerError(null);
      setSuccess(false);
    }
  }, [open, initialCoin]);

  /* Keep network valid when coin changes */
  useEffect(() => {
    const allowed = WITHDRAW_NETWORKS_FOR_COIN[coin];
    if (!allowed.includes(network)) setNetwork(allowed[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin]);

  /* Lock body scroll */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    return undefined;
  }, [open]);

  const fee          = fees[network];
  const numericAmount = Number(amount);
  const amountValid   = Number.isFinite(numericAmount) && numericAmount > 0;

  const netAmount = useMemo(() => {
    if (!amountValid || typeof fee !== 'number') return 0;
    return Math.max(0, numericAmount - fee);
  }, [amountValid, numericAmount, fee]);

  const addressCheck  = toAddress
    ? validateAddressForNetwork(network, toAddress)
    : { valid: false, reason: '' };
  const insufficient  = amountValid && numericAmount > balance;
  const belowFee      = amountValid && typeof fee === 'number' && numericAmount <= fee;

  const canSubmit =
    amountValid &&
    !!toAddress.trim() &&
    addressCheck.valid &&
    !insufficient &&
    !belowFee &&
    typeof fee === 'number' &&
    !isSubmitting;

  const setAmountSafe = (raw: string): void => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const dotIdx  = cleaned.indexOf('.');
    let normalized = cleaned;
    if (dotIdx >= 0) {
      const left  = cleaned.slice(0, dotIdx);
      const right = cleaned.slice(dotIdx + 1).replace(/\./g, '').slice(0, decimalsForCoin(coin));
      normalized  = right ? `${left}.${right}` : `${left}.`;
    }
    setAmount(normalized);
  };

  const fillPercent = (pct: number): void => {
    if (!Number.isFinite(balance) || balance <= 0) return;
    const factor   = 10 ** decimalsForCoin(coin);
    const truncated = Math.floor((balance * pct / 100) * factor) / factor;
    setAmount(String(truncated));
  };

  const handleSubmit = async (): Promise<void> => {
    setServerError(null);
    if (!canSubmit) return;
    try {
      await submit({ amount: numericAmount, currency: coin, network, toAddress: toAddress.trim() });
      setSuccess(true);
      window.setTimeout(() => onClose(), 2500);
    } catch (err) {
      setServerError((err as NormalizedApiError).message || 'Could not submit withdrawal');
    }
  };

  if (!open) return null;

  const handleClose = (): void => { if (!isSubmitting) onClose(); };
  const networkOptions = WITHDRAW_NETWORKS_FOR_COIN[coin];

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="animate-backdrop-in fixed inset-0 z-40 bg-[var(--overlay)]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Withdraw Crypto"
        className={cn(
          'fixed z-50 flex flex-col',
          'bg-[var(--bg-elevated)] border border-[var(--border)]',
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl max-h-[94dvh] overflow-y-auto animate-[modal-slide-up_180ms_ease-out]'
            : 'animate-modal-in top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto',
        )}
      >
        {/* Drag handle (mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
          </div>
        )}

        {/* Header */}
        {!success && (
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Withdraw Crypto
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg
                         text-[var(--text-muted)] transition-colors duration-150
                         hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-5 py-5">
          {success ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span
                className="inline-flex h-16 w-16 items-center justify-center rounded-full
                           bg-[var(--success-muted)] text-[var(--success)]"
              >
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Withdrawal submitted
                </h3>
                <p className="mt-1.5 max-w-sm text-sm text-[var(--text-secondary)]">
                  Your request is pending review. The held amount has been deducted from your
                  available balance until an admin approves it.
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className="flex flex-col gap-5"
              noValidate
            >

              {/* ── Coin selector ── */}
              <section>
                <label className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                  Coin
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {COINS.map((c) => {
                    const selected = coin === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCoin(c)}
                        aria-pressed={selected}
                        className={cn(
                          'inline-flex items-center justify-center gap-2.5 rounded-xl border h-11',
                          'text-sm font-medium transition-all duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                          selected
                            ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)] shadow-[0_0_0_1px_var(--accent)]'
                            : 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        <CoinIcon coin={c} size="xs" />
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Network selector ── */}
              <section>
                <label className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                  Network
                </label>
                <div
                  className="mt-3 grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${networkOptions.length}, minmax(0, 1fr))` }}
                >
                  {networkOptions.map((n) => {
                    const selected = network === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNetwork(n)}
                        aria-pressed={selected}
                        className={cn(
                          'rounded-xl border h-10 px-3 text-sm font-medium transition-all duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                          selected
                            ? 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--text-primary)] shadow-[0_0_0_1px_var(--accent)]'
                            : 'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        {CoinNetworkMap.label(n)}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── Available balance ── */}
              <div
                className="flex items-center justify-between rounded-xl
                           border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2.5"
              >
                <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                  Available balance
                </span>
                <span className="tabular text-sm font-semibold text-[var(--text-primary)]">
                  {formatAmount(balance, 'USDT')}
                </span>
              </div>

              {/* ── Destination address ── */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="withdraw-to"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  Destination address
                </label>
                <input
                  id="withdraw-to"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="Paste wallet address"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className={cn(
                    'h-11 w-full rounded-xl border bg-[var(--bg-muted)] px-4',
                    'font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                    'transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]',
                    toAddress && !addressCheck.valid
                      ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                      : 'border-[var(--border)] focus:border-[var(--accent)]',
                  )}
                />
                {toAddress && !addressCheck.valid && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--danger)]">
                    <AlertCircle className="h-3 w-3" />
                    {addressCheck.reason}
                  </span>
                )}
              </div>

              {/* ── Amount ── */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="withdraw-amount"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  Amount
                </label>
                <div
                  className={cn(
                    'relative flex items-center rounded-xl border bg-[var(--bg-muted)]',
                    'transition-colors duration-150',
                    insufficient || belowFee
                      ? 'border-[var(--danger)]'
                      : 'border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--focus-ring)]',
                  )}
                >
                  <input
                    id="withdraw-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmountSafe(e.target.value)}
                    className="h-11 w-full bg-transparent px-4 tabular text-sm
                               text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                               focus:outline-none"
                  />
                  <span className="shrink-0 px-4 text-xs font-semibold text-[var(--text-muted)]">
                    {coin}
                  </span>
                </div>

                {/* Quick-fill pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {QUICK_FILL.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => fillPercent(p)}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-muted)]
                                 px-2.5 h-6 text-[11px] font-medium text-[var(--text-secondary)]
                                 transition-colors duration-150
                                 hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]
                                 hover:text-[var(--text-primary)]
                                 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
                    >
                      {p}%
                    </button>
                  ))}
                </div>

                {insufficient && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--danger)]">
                    <AlertCircle className="h-3 w-3" />
                    Amount exceeds your available balance.
                  </span>
                )}
                {belowFee && (
                  <span className="flex items-center gap-1 text-[11px] text-[var(--danger)]">
                    <AlertCircle className="h-3 w-3" />
                    Amount must be greater than the network fee.
                  </span>
                )}
              </div>

              {/* ── Fee + receive summary ── */}
              <div
                className="flex flex-col gap-2 rounded-xl border border-[var(--border)]
                           bg-[var(--bg-muted)] p-4"
              >
                <FeeRow
                  label="Network fee"
                  value={
                    feesLoading ? (
                      <Spinner size="sm" />
                    ) : typeof fee === 'number' ? (
                      <span className="tabular">{formatAmount(fee, coin)}</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Not configured</span>
                    )
                  }
                />
                <div className="h-px bg-[var(--border)]" />
                <FeeRow
                  label="You receive"
                  emphasize
                  value={
                    <span className="tabular text-[var(--text-primary)]">
                      {amountValid && typeof fee === 'number'
                        ? formatAmount(netAmount, coin)
                        : `0 ${coin}`}
                    </span>
                  }
                />
              </div>

              {/* Irreversible warning */}
              <IrreversibleWarning />

              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border
                             border-[var(--danger)] bg-[var(--danger-muted)]
                             px-4 py-2.5 text-xs text-[var(--danger)]"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  disabled={!canSubmit}
                >
                  Submit withdrawal
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes modal-slide-up {
          from { transform: translateY(100%); opacity: 0.6; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function FeeRow({
  label,
  value,
  emphasize = false,
}: {
  label:     string;
  value:     React.ReactNode;
  emphasize?: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          'text-xs',
          emphasize ? 'font-medium text-[var(--text-secondary)]' : 'text-[var(--text-muted)]',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'inline-flex items-center text-sm',
          emphasize ? 'font-semibold' : 'text-[var(--text-secondary)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}
