// components/trade/ConfirmTradeModal.tsx
// ── CONFIRM TRADE MODAL — Correct P&L preview ──
// FIXED P&L MODEL:
//   risk = stake × multiplier
//   fee  = risk × feeRate
//   WIN:  netGain = risk - fee  |  credited = stake + netGain
//   LOSS: totalLoss = risk + fee  |  credited = stake - totalLoss

import { X, Loader2 } from 'lucide-react';
import { calcPnl } from '@/lib/tradePnl';
import type { Currency } from '@/types/convert';
import type { TradeDirection, TradingPlan, TradingPair } from '@/types/trade';

interface ConfirmTradeModalProps {
  open:         boolean;
  onClose:      () => void;
  pair:         TradingPair | null;
  direction:    TradeDirection;
  plan:         TradingPlan | null;
  tradingAsset: Currency;
  stake:        number;
  entryPrice:   number | null;
  feeBps:       number;
  isLoading:    boolean;
  error:        string | null;
  onConfirm:    () => void;
}

function formatPrice(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '—';
  if (v >= 100)  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1)    return v.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return v.toFixed(6);
}

function fmt(v: number, asset: Currency): string {
  if (asset === 'USDT') return v.toFixed(2);
  if (v < 0.0001) return v.toFixed(8);
  if (v < 1)      return v.toFixed(6);
  return v.toFixed(4);
}

export function ConfirmTradeModal({
  open, onClose, pair, direction, plan, tradingAsset,
  stake, entryPrice, feeBps, isLoading, error, onConfirm,
}: ConfirmTradeModalProps) {
  if (!open) return null;

  const isBuy = direction === 'buy';

  // ── CORRECT P&L ──
  const pnl = calcPnl(stake, plan?.multiplier ?? 0, feeBps);

  const content = (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Confirm Trade</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            isBuy ? 'bg-[var(--success-muted)] text-[var(--success)]'
                  : 'bg-[var(--danger-muted)] text-[var(--danger)]'
          }`}>
            {isBuy ? 'BUY' : 'SELL'}
          </span>
        </div>
        <button type="button" onClick={onClose} disabled={isLoading}
          className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Trade summary */}
      <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
        <ModalRow label="Pair"      value={pair?.display ?? '—'} />
        <ModalRow label="Direction" value={isBuy ? 'BUY' : 'SELL'}
          valueClass={isBuy ? 'text-[var(--success)]' : 'text-[var(--danger)]'} />
        <ModalRow label="Plan"
          value={plan ? `${plan.key} · ${plan.durationSec}s · +${(plan.multiplier * 100).toFixed(0)}%` : '—'} />
        <ModalRow label="Stake"       value={`${fmt(stake, tradingAsset)} ${tradingAsset}`} tabular />
        <ModalRow label="At Risk"     value={`${fmt(pnl.risk, tradingAsset)} ${tradingAsset}`} tabular />
        <ModalRow label="Entry Price" value={formatPrice(entryPrice)} tabular />
        <ModalRow label="Fee"
          value={`${fmt(pnl.fee, tradingAsset)} ${tradingAsset} (${pnl.feePct}%)`} tabular />
      </div>

      {/* Win / Loss scenarios */}
      <div className="flex flex-col gap-2">
        {/* Win */}
        <div className="rounded-lg bg-[var(--success-muted)] border border-[var(--success)]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">If Won</span>
            <div className="text-right">
              <span className="tabular text-base font-bold text-[var(--success)]">
                +{fmt(pnl.netGain, tradingAsset)} {tradingAsset}
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                {fmt(pnl.winCredited, tradingAsset)} {tradingAsset} credited back
              </p>
            </div>
          </div>
        </div>

        {/* Loss */}
        <div className="rounded-lg bg-[var(--danger-muted)] border border-[var(--danger)]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">If Lost</span>
            <div className="text-right">
              <span className="tabular text-base font-bold text-[var(--danger)]">
                -{fmt(pnl.totalLoss, tradingAsset)} {tradingAsset}
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                {fmt(pnl.lossCredited, tradingAsset)} {tradingAsset} returned
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-[var(--danger-muted)] px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={onConfirm} disabled={isLoading}
          className="flex items-center justify-center rounded-xl bg-[var(--accent)] py-3 font-bold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Confirm Trade
        </button>
        <button type="button" onClick={onClose} disabled={isLoading}
          className="rounded-xl border border-[var(--border)] py-3 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] disabled:opacity-50">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="fixed inset-0 z-50 hidden items-center justify-center md:flex">
        <div className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in"
          onClick={isLoading ? undefined : onClose} />
        <div className="relative z-10 w-full max-w-md animate-modal-in">
          <div className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
            {content}
          </div>
        </div>
      </div>
      {/* Mobile */}
      <div className="fixed inset-0 z-50 flex items-end md:hidden">
        <div className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in"
          onClick={isLoading ? undefined : onClose} />
        <div className="relative z-10 w-full animate-modal-in rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
          {content}
        </div>
      </div>
    </>
  );
}

function ModalRow({ label, value, valueClass, tabular }: {
  label: string; value: string; valueClass?: string; tabular?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-medium text-[var(--text-primary)] ${tabular ? 'tabular' : ''} ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}