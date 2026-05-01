// components/trade/ActiveTradeCard.tsx
// ── ACTIVE TRADE CARD ──
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Trade } from '@/types/trade';

interface ActiveTradeCardProps {
  trade: Trade;
}

const CIRCUMFERENCE = 2 * Math.PI * 52; // ~326.725

export function ActiveTradeCard({ trade }: ActiveTradeCardProps) {
  const expiresAtMs = new Date(trade.expiresAt).getTime();
  const durationSec = trade.planDurationSec;

  const calcSecondsLeft = () =>
    Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));

  const [secondsLeft, setSecondsLeft] = useState(calcSecondsLeft);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      const next = calcSecondsLeft();
      setSecondsLeft(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAtMs, durationSec]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes}:${String(secs).padStart(2, '0')}`;

  const elapsed = durationSec - secondsLeft;
  const ratio = secondsLeft > 0 ? Math.min(elapsed / durationSec, 1) : 1;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);

  const grossWin = trade.stake * (1 + trade.planMultiplier);
  const profit = grossWin - trade.stake;
  const fee = profit * (trade.feeBps / 10000);
  const estimatedPayout = grossWin - fee;

  function formatNum(v: number): string {
    if (trade.tradingAsset === 'USDT') return v.toFixed(2);
    if (v < 0.0001) return v.toFixed(8);
    if (v < 1) return v.toFixed(6);
    return v.toFixed(4);
  }

  return (
    <div className="relative animate-modal-in rounded-xl border border-[var(--accent)] bg-[var(--accent-muted)] p-4">
      {/* Pulse dot */}
      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--success)] animate-ping" />
      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--success)]" />

      {/* Top row */}
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
          {trade.pairDisplay}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            trade.direction === 'buy'
              ? 'bg-[var(--success-muted)] text-[var(--success)]'
              : 'bg-[var(--danger-muted)] text-[var(--danger)]'
          }`}
        >
          {trade.direction.toUpperCase()}
        </span>
        <span className="rounded-full bg-[var(--info-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--info)]">
          Active
        </span>
      </div>

      {/* Countdown ring + timer */}
      <div className="my-5 flex items-center justify-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke="var(--border)"
              strokeWidth={6}
            />
            <circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE.toFixed(1)}
              strokeDashoffset={dashOffset.toFixed(1)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {secondsLeft > 0 ? (
              <span className="tabular text-3xl font-bold text-[var(--accent)]">
                {timeStr}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--warning)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Resolving...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>
          Stake:{' '}
          <span className="tabular font-medium text-[var(--text-primary)]">
            {formatNum(trade.stake)} {trade.tradingAsset}
          </span>
        </span>
        <span>
          Plan:{' '}
          <span className="font-medium text-[var(--text-primary)]">
            {trade.planKey}
          </span>
        </span>
        <span>
          Entry:{' '}
          <span className="tabular font-medium text-[var(--text-primary)]">
            {formatNum(trade.entryPrice)}
          </span>
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold tabular text-[var(--success)]">
        Est. payout: {formatNum(estimatedPayout)} {trade.tradingAsset}
      </p>
    </div>
  );
}