// components/funds/WithdrawModal.tsx
// ── Single-step withdrawal form — Binance/Bybit standard ──
// Mobile  → bottom sheet (rounded-t-2xl, slides up from bottom)
// Desktop → centered dialog (fixed inset-0 flex items-center justify-center)

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, X, AlertCircle, Wallet,
} from 'lucide-react';
import { Spinner }              from '@/components/ui/Spinner';
import { IrreversibleWarning }  from './NetworkWarning';
import { cn }                   from '@/lib/cn';
import { formatAmount }         from '@/lib/format';
import { validateAddressForNetwork } from '@/lib/addressValidation';
import {
  COINS,
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
  const [success, setSuccess]         = useState(false);

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
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const fee           = fees[network];
  const numericAmount = Number(amount);
  const amountValid   = Number.isFinite(numericAmount) && numericAmount > 0;

  const netAmount = useMemo(() => {
    if (!amountValid || typeof fee !== 'number') return 0;
    return Math.max(0, numericAmount - fee);
  }, [amountValid, numericAmount, fee]);

  const addressCheck = toAddress
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

  const panelContent = (
    <>
      {/* ── Success state ── */}
      {success ? (
        <div className="flex flex-col items-center gap-5 px-6 py-12 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'var(--success-muted)' }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Withdrawal submitted</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              Your request is pending admin review. The held amount has been deducted from your
              available balance until the withdrawal is approved.
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs"
            style={{ borderColor: 'var(--success)', background: 'var(--success-muted)', color: 'var(--success)' }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Closing automatically…
          </div>
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Withdraw Crypto</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Funds arrive after admin approval</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--hover-bg)] disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Scrollable form body ── */}
          <div className="flex-1 overflow-y-auto">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className="flex flex-col gap-5 px-5 py-5"
              noValidate
            >
              {/* ── Coin selector ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Coin
                </label>
                <div className="flex flex-wrap gap-2">
                  {COINS.map((c) => {
                    const isActive = coin === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCoin(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-150"
                        style={{
                          background:  isActive ? 'var(--accent-muted)' : 'var(--bg-muted)',
                          color:       isActive ? 'var(--accent)'        : 'var(--text-secondary)',
                          borderColor: isActive ? 'var(--accent)'        : 'var(--border)',
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Network selector ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Network
                </label>
                <div className="flex flex-wrap gap-2">
                  {networkOptions.map((n) => {
                    const isActive = network === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNetwork(n)}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-150"
                        style={{
                          background:  isActive ? 'var(--accent-muted)' : 'var(--bg-muted)',
                          color:       isActive ? 'var(--accent)'        : 'var(--text-secondary)',
                          borderColor: isActive ? 'var(--accent)'        : 'var(--border)',
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Available balance ── */}
              <div
                className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3"
                style={{ background: 'var(--bg-muted)' }}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs text-[var(--text-secondary)]">Available balance</span>
                </div>
                <span className="tabular text-sm font-bold text-[var(--text-primary)]">
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
                    'h-11 w-full rounded-xl border px-4',
                    'font-mono text-xs placeholder:text-[var(--text-muted)]',
                    'transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)]',
                    toAddress && !addressCheck.valid
                      ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                      : 'border-[var(--border)] focus:border-[var(--accent)]',
                  )}
                  style={{
                    background: 'var(--bg-muted)',
                    color:      'var(--text-primary)',
                  }}
                />
                {toAddress && !addressCheck.valid && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--danger)' }}>
                    <AlertCircle className="h-3 w-3" />
                    {addressCheck.reason}
                  </span>
                )}
                {toAddress && addressCheck.valid && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--success)' }}>
                    <CheckCircle2 className="h-3 w-3" />
                    Valid {network} address
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
                    'relative flex items-center rounded-xl border',
                    'transition-colors duration-150',
                    insufficient || belowFee
                      ? 'border-[var(--danger)]'
                      : 'border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--focus-ring)]',
                  )}
                  style={{ background: 'var(--bg-muted)' }}
                >
                  <input
                    id="withdraw-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmountSafe(e.target.value)}
                    className="h-11 w-full bg-transparent px-4 tabular text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <span className="shrink-0 px-4 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
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
                      className="rounded-full border px-2.5 h-6 text-[11px] font-medium transition-all duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
                      style={{
                        borderColor: 'var(--border)',
                        background:  'var(--bg-muted)',
                        color:       'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                        (e.currentTarget as HTMLButtonElement).style.background   = 'var(--accent-muted)';
                        (e.currentTarget as HTMLButtonElement).style.color        = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLButtonElement).style.background   = 'var(--bg-muted)';
                        (e.currentTarget as HTMLButtonElement).style.color        = 'var(--text-secondary)';
                      }}
                    >
                      {p === 100 ? 'MAX' : `${p}%`}
                    </button>
                  ))}
                </div>

                {insufficient && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--danger)' }}>
                    <AlertCircle className="h-3 w-3" />
                    Amount exceeds your available balance.
                  </span>
                )}
                {belowFee && (
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--danger)' }}>
                    <AlertCircle className="h-3 w-3" />
                    Amount must be greater than the network fee.
                  </span>
                )}
              </div>

              {/* ── Fee + receive summary ── */}
              <div
                className="flex flex-col gap-2.5 rounded-xl border border-[var(--border)] p-4"
                style={{ background: 'var(--bg-muted)' }}
              >
                <FeeRow
                  label="Network fee"
                  value={
                    feesLoading ? (
                      <Spinner size="sm" />
                    ) : typeof fee === 'number' ? (
                      <span className="tabular">{formatAmount(fee, coin)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not configured</span>
                    )
                  }
                />
                <div className="h-px" style={{ background: 'var(--border)' }} />
                <FeeRow
                  label="You receive"
                  emphasize
                  value={
                    <span className="tabular" style={{ color: 'var(--text-primary)' }}>
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
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 text-xs"
                  style={{
                    borderColor: 'var(--danger)',
                    background:  'var(--danger-muted)',
                    color:       'var(--danger)',
                  }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </div>
              )}

              {/* ── Submit / Cancel ── */}
              <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: canSubmit ? 'var(--danger)'     : 'var(--disabled)',
                    color:      canSubmit ? 'var(--text-inverse)': 'var(--disabled-text)',
                    boxShadow:  canSubmit ? '0 0 16px var(--danger-muted)' : 'none',
                  }}
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isSubmitting ? 'Submitting…' : 'Submit withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* ── Keyframe ── */}
      <style>{`
        @keyframes withdraw-slide-up {
          from { transform: translateY(100%); opacity: 0.7; }
          to   { transform: translateY(0);    opacity: 1;   }
        }
        @keyframes withdraw-fade-scale {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'var(--overlay)' }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {isMobile ? (
        /* ── MOBILE: bottom sheet ── */
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Withdraw Crypto"
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[var(--border)] overflow-hidden"
          style={{
            background: 'var(--bg-elevated)',
            maxHeight: '94dvh',
            animation: 'withdraw-slide-up 220ms cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          }}
        >
          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
          </div>
          {panelContent}
        </div>
      ) : (
        /* ── DESKTOP: true centered dialog ── */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Withdraw Crypto"
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)]"
            style={{
              background: 'var(--bg-elevated)',
              maxHeight:  '90dvh',
              animation:  'withdraw-fade-scale 180ms ease-out',
              boxShadow:  '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {panelContent}
          </div>
        </div>
      )}
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
        className="text-xs"
        style={{ color: emphasize ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: emphasize ? 500 : 400 }}
      >
        {label}
      </span>
      <span
        className="inline-flex items-center text-sm"
        style={{ fontWeight: emphasize ? 600 : 400, color: emphasize ? 'var(--text-primary)' : 'var(--text-secondary)' }}
      >
        {value}
      </span>
    </div>
  );
}
