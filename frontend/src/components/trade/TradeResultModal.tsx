// components/trade/TradeResultModal.tsx
// ── TRADE RESULT MODAL ──
// BUG 2 FIX: Added auto-close after 5 seconds.
//            Parent should pass a `key` prop equal to trade._id so React
//            re-mounts and resets the timer for each new result.

import { useState, useEffect } from 'react';
import type { Trade } from '@/types/trade';

interface TradeResultModalProps {
  trade: Trade | null;
  onClose: () => void;
}

interface ConfettiPiece {
  id: number;
  color: string;
  left: number;
  delay: number;
}

function generateConfetti(): ConfettiPiece[] {
  const colors = [
    'var(--success)',
    'var(--accent)',
    'var(--warning)',
    'var(--info)',
    'var(--danger)',
  ];
  return Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
  }));
}

const AUTO_CLOSE_MS = 5000;

export function TradeResultModal({ trade, onClose }: TradeResultModalProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (trade?.status === 'won') {
      setConfetti(generateConfetti());
      const t = setTimeout(() => setConfetti([]), 2000);
      return () => clearTimeout(t);
    }
    setConfetti([]);
  }, [trade]);

  useEffect(() => {
    if (!trade) return;

    setProgress(100);

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
    }, 50);

    const closeTimer = setTimeout(() => {
      onClose();
    }, AUTO_CLOSE_MS);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(closeTimer);
    };
  }, [trade, onClose]);

  if (!trade) return null;

  const isWon = trade.status === 'won';
  
  // Calculate correct values for display
  const stake = trade.stake || 0;
  const multiplier = trade.planMultiplier || 0;
  const feeBps = trade.feeBps || 200;
  const feeRate = feeBps / 10000;
  
  let displayAmount = 0;
  let displayText = '';
  
  if (isWon) {
    const profit = stake * multiplier;
    const fee = profit * feeRate;
    const payout = stake + profit - fee;
    const netResult = profit - fee;
    displayAmount = payout;
    displayText = `+${payout.toFixed(8)} ${trade.tradingAsset}`;
  } else {
    const riskAmount = stake * multiplier;
    const fee = riskAmount * feeRate;
    const totalLoss = riskAmount + fee;
    const unriskedReturn = stake - riskAmount;
    displayAmount = unriskedReturn;
    displayText = `-${totalLoss.toFixed(8)} ${trade.tradingAsset}`;
  }

  const content = (
    <div className="relative flex flex-col items-center gap-4 p-6 pb-8">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-[var(--border)]">
        <div
          className="h-full transition-none"
          style={{
            width: `${progress}%`,
            backgroundColor: isWon ? 'var(--success)' : 'var(--danger)',
            transition: 'width 50ms linear',
          }}
        />
      </div>

      {isWon &&
        confetti.map((c) => (
          <span
            key={c.id}
            className="pointer-events-none absolute top-0 h-3 w-2 rounded-sm"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              animation: `confetti-fall 1.5s ${c.delay}s ease-out forwards`,
              opacity: 0,
            }}
          />
        ))}

      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          isWon ? 'bg-[var(--success-muted)]' : 'bg-[var(--danger-muted)]'
        }`}
      >
        <span
          className={`text-3xl font-bold ${
            isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}
        >
          {isWon ? '✓' : '✕'}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        {isWon ? 'You Won!' : 'Trade Closed'}
      </h1>

      <span
        className={`tabular text-3xl font-bold ${
          isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'
        }`}
      >
        {displayText}
      </span>

      {isWon ? (
        <p className="text-sm text-[var(--text-muted)]">
          Net profit after {((trade.feeBps ?? 0) / 100).toFixed(2)}% fee
        </p>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-[var(--text-muted)]">
            Risk lost · {((trade.planMultiplier ?? 0) * 100).toFixed(0)}% of stake
          </p>
          {displayAmount > 0 && (
            <p className="text-xs text-[var(--text-secondary)]">
              {displayAmount.toFixed(4)} {trade.tradingAsset} returned to balance
            </p>
          )}
        </div>
      )}

      {isWon && (
        <span className="tabular text-sm font-medium text-[var(--success)]">
          Net: +{(stake * multiplier * (1 - feeRate)).toFixed(8)} {trade.tradingAsset}
        </span>
      )}

      <p className="text-xs text-[var(--text-muted)]">Closing automatically…</p>

      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] py-3 font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 hidden items-center justify-center md:flex">
        <div
          className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in"
          onClick={onClose}
        />
        <div
          className="relative z-10 w-full max-w-sm animate-modal-in"
        >
          <div className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden">
            {content}
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-50 flex items-end md:hidden">
        <div
          className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in"
          onClick={onClose}
        />
        <div
          className="relative z-10 w-full animate-modal-in rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden"
        >
          {content}
        </div>
      </div>
    </>
  );
}