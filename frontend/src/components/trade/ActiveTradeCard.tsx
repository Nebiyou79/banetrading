// components/trade/ActiveTradeCard.tsx
// ── ACTIVE TRADE CARD — Bybit-inspired design ──
// FIXED P&L MODEL:
//   risk      = stake × multiplier
//   fee       = risk × feeRate
//   WIN:  netGain = risk - fee  |  credited = stake + netGain
//   LOSS: totalLoss = risk + fee  |  credited = stake - totalLoss

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { calcPnl } from '@/lib/tradePnl';
import type { Trade } from '@/types/trade';

interface ActiveTradeCardProps {
  trade: Trade;
}

const CIRCUMFERENCE = 2 * Math.PI * 48;

export function ActiveTradeCard({ trade }: ActiveTradeCardProps) {
  const expiresAtMs  = new Date(trade.expiresAt).getTime();
  const durationSec  = trade.planDurationSec;

  const calcSecondsLeft = () => Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(calcSecondsLeft);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      const next = calcSecondsLeft();
      setSecondsLeft(next);
      if (next <= 0) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAtMs]);

  const minutes  = Math.floor(secondsLeft / 60);
  const secs     = secondsLeft % 60;
  const timeStr  = `${minutes}:${String(secs).padStart(2, '0')}`;
  const durationStr = durationSec >= 60
    ? `${Math.floor(durationSec / 60)}m`
    : `${durationSec}s`;

  const elapsed     = durationSec - secondsLeft;
  const ratio       = durationSec > 0 ? Math.min(elapsed / durationSec, 1) : 1;
  const dashOffset  = CIRCUMFERENCE * (1 - ratio);
  const progressPct = Math.round(ratio * 100);

  // ── CORRECT P&L (fixed model) ──
  const pnl    = calcPnl(trade.stake, trade.planMultiplier, trade.feeBps);
  const isBuy  = trade.direction === 'buy';

  return (
    <div className="relative rounded-xl border border-[var(--accent)]/30 bg-[var(--bg-elevated)] overflow-hidden">
      {/* Direction accent bar */}
      <div className={`h-0.5 w-full ${isBuy ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />

      <div className="p-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--bg-muted)] px-2 py-1 text-xs font-bold text-[var(--text-primary)] tracking-wide">
              {trade.pairDisplay}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              isBuy
                ? 'bg-[var(--success-muted)] text-[var(--success)]'
                : 'bg-[var(--danger-muted)] text-[var(--danger)]'
            }`}>
              {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isBuy ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--info-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--info)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] animate-pulse" />
            LIVE
          </span>
        </div>

        {/* ── Timer + Stats ── */}
        <div className="flex items-center gap-4 mb-3">
          {/* Circular timer */}
          <div className="relative inline-flex items-center justify-center flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 112 112">
              <circle cx={56} cy={56} r={48} fill="none" stroke="var(--border)" strokeWidth={5} />
              <circle
                cx={56} cy={56} r={48} fill="none"
                stroke={isBuy ? 'var(--success)' : 'var(--danger)'}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE.toFixed(1)}
                strokeDashoffset={dashOffset.toFixed(1)}
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`tabular text-lg font-bold ${isBuy ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {secondsLeft > 0 ? timeStr : '…'}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] mt-0.5">
                Remaining
              </span>
              <span className="text-[9px] text-[var(--text-muted)]">
                of {durationStr}
              </span>
            </div>
          </div>

          {/* Stats column */}
          <div className="flex flex-col gap-2 flex-1">
            <StatRow label="Stake"      value={`${pnl.stake.toFixed(2)} ${trade.tradingAsset}`} />
            <StatRow label="Multiplier" value={pnl.multiplierDisplay} />
            <StatRow
              label="Est. Payout"
              value={`+${pnl.netGain.toFixed(2)} ${trade.tradingAsset}`}
              valueClass="text-[var(--success)] font-bold"
            />
          </div>
        </div>

        {/* ── Entry / Plan / Fee row ── */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--bg-muted)] px-3 py-2.5 mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Entry Price
            </span>
            <span className="tabular text-xs font-semibold text-[var(--text-primary)]">
              {trade.entryPrice != null
                ? trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
                : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 border-x border-[var(--border)] px-2">
            <span className="text-[10px] text-[var(--text-muted)]">Plan</span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{trade.planKey}</span>
          </div>
          <div className="flex flex-col gap-0.5 pl-2">
            <span className="text-[10px] text-[var(--text-muted)]">Fee</span>
            <span className="tabular text-xs font-semibold text-[var(--text-primary)]">
              {pnl.feePct}%
            </span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isBuy ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="tabular text-[10px] text-[var(--text-muted)] w-8 text-right">{progressPct}%</span>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label, value, valueClass,
}: {
  label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className={`tabular text-sm font-semibold text-[var(--text-primary)] ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}