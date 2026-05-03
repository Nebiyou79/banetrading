// components/trade/ActiveTradeCard.tsx
// ── ACTIVE TRADE CARD — Professional countdown display ──

import { useEffect, useState } from 'react';
import { Loader2, Timer } from 'lucide-react';
import type { Trade } from '@/types/trade';

interface ActiveTradeCardProps {
  trade: Trade;
}

const CIRCUMFERENCE = 2 * Math.PI * 48;

export function ActiveTradeCard({ trade }: ActiveTradeCardProps) {
  const expiresAtMs = new Date(trade.expiresAt).getTime();
  const durationSec = trade.planDurationSec;

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
  }, [expiresAtMs]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes}:${String(secs).padStart(2, '0')}`;

  const elapsed = durationSec - secondsLeft;
  const ratio = secondsLeft > 0 ? Math.min(elapsed / durationSec, 1) : 1;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);

  const estimatedPayout = trade.stake * (1 + trade.planMultiplier) * (1 - trade.feeBps / 10000);

  return (
    <div className="relative rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-muted)]/50 p-4 overflow-hidden">
      {/* Background pulse */}
      <div className="absolute inset-0 bg-[var(--accent)]/5 animate-pulse" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-muted)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)]">
            {trade.pairDisplay}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
            trade.direction === 'buy'
              ? 'bg-[var(--success-muted)] text-[var(--success)]'
              : 'bg-[var(--danger-muted)] text-[var(--danger)]'
          }`}>
            {trade.direction.toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--info-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--info)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)] animate-pulse" />
            Active
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx={56} cy={56} r={48} fill="none" stroke="var(--border)" strokeWidth={5} />
              <circle
                cx={56} cy={56} r={48} fill="none" stroke="var(--accent)" strokeWidth={5}
                strokeLinecap="round" strokeDasharray={CIRCUMFERENCE.toFixed(1)}
                strokeDashoffset={dashOffset.toFixed(1)}
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {secondsLeft > 0 ? (
                <span className="tabular text-2xl font-bold text-[var(--accent)]">{timeStr}</span>
              ) : (
                <Loader2 className="w-6 h-6 text-[var(--warning)] animate-spin" />
              )}
              <span className="text-[10px] text-[var(--text-muted)]">remaining</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Stake</span>
            <p className="tabular text-sm font-semibold text-[var(--text-primary)]">
              {trade.stake.toFixed(4)} {trade.tradingAsset}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Plan</span>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{trade.planKey}</p>
          </div>
          <div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Est. Payout</span>
            <p className="tabular text-sm font-semibold text-[var(--success)]">
              +{estimatedPayout.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}