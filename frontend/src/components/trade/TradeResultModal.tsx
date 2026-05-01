// components/trade/TradeResultModal.tsx
// ── TRADE RESULT MODAL ──
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

export function TradeResultModal({ trade, onClose }: TradeResultModalProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trade?.status === 'won') {
      setConfetti(generateConfetti());
      const t = setTimeout(() => setConfetti([]), 2000);
      return () => clearTimeout(t);
    }
    setConfetti([]);
  }, [trade]);

  if (!trade) return null;

  const isWon = trade.status === 'won';

  const content = (
    <div className="relative flex flex-col items-center gap-4 p-6 pb-8">
      {/* Confetti */}
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

      {/* Icon */}
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

      {/* Headline */}
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        {isWon ? 'You Won!' : 'Trade Closed'}
      </h1>

      {/* Amount */}
      <span
        className={`tabular text-3xl font-bold ${
          isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'
        }`}
      >
        {isWon
          ? `+${(trade.payout ?? 0).toFixed(8)} ${trade.tradingAsset}`
          : `${(trade.netResult ?? 0).toFixed(8)} ${trade.tradingAsset}`}
      </span>

      {/* Subtitle */}
      <p className="text-sm text-[var(--text-muted)]">
        {isWon
          ? `Net profit after ${((trade.feeBps ?? 0) / 100).toFixed(2)}% fee`
          : 'Your stake was not recovered'}
      </p>

      {/* Net result */}
      {isWon && (
        <span className="tabular text-sm font-medium text-[var(--success)]">
          +{((trade.netResult ?? 0)).toFixed(8)} {trade.tradingAsset}
        </span>
      )}

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] py-3 font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
      >
        Close
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop backdrop + centered modal */}
      <div className="fixed inset-0 z-50 hidden items-center justify-center md:flex">
        <div
          className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in"
          onClick={onClose}
        />
        <div
          className="relative z-10 w-full max-w-sm animate-modal-in"
          style={{
            animation: 'modal-pop-in 0.22s ease-out',
          }}
        >
          <div className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
            {content}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="fixed inset-0 z-50 flex items-end md:hidden">
        <div
          className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in"
          onClick={onClose}
        />
        <div
          className="relative z-10 w-full animate-modal-in rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl"
          style={{
            animation: 'slide-up 0.22s ease-out',
          }}
        >
          {content}
        </div>
      </div>
    </>
  );
}