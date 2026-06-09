// components/trade/TradeResultModal.tsx
// ── TRADE RESULT MODAL — Corrected P&L for Win AND Loss ──
// FIXED P&L MODEL:
//   risk        = stake × multiplier
//   fee         = risk × feeRate
//   WIN:  netGain    = risk - fee  →  credited = stake + netGain
//   LOSS: totalLoss  = risk + fee  →  credited = stake - totalLoss  (partial refund)

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, X } from 'lucide-react';
import { calcPnl } from '@/lib/tradePnl';
import type { Trade } from '@/types/trade';

interface TradeResultModalProps {
  trade: Trade | null;
  onClose: () => void;
}

interface ConfettiPiece { id: number; color: string; left: number; delay: number; }

function generateConfetti(): ConfettiPiece[] {
  const colors = ['var(--success)', 'var(--accent)', 'var(--warning)', 'var(--info)', 'var(--danger)'];
  return Array.from({ length: 30 }).map((_, i) => ({
    id: i, color: colors[i % colors.length],
    left: Math.random() * 100, delay: Math.random() * 0.5,
  }));
}

function fmt(v: number, asset: string): string {
  if (asset === 'USDT') return v.toFixed(2);
  if (v < 0.0001) return v.toFixed(8);
  if (v < 1) return v.toFixed(6);
  return v.toFixed(4);
}

const AUTO_CLOSE_MS = 5000;

export function TradeResultModal({ trade, onClose }: TradeResultModalProps) {
  const [confetti,    setConfetti]    = useState<ConfettiPiece[]>([]);
  const [progress,    setProgress]    = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(AUTO_CLOSE_MS / 1000));

  useEffect(() => {
    if (trade?.status === 'won') {
      setConfetti(generateConfetti());
      const t = setTimeout(() => setConfetti([]), 2500);
      return () => clearTimeout(t);
    }
    setConfetti([]);
  }, [trade]);

  useEffect(() => {
    if (!trade) return;
    setProgress(100);
    setSecondsLeft(Math.ceil(AUTO_CLOSE_MS / 1000));
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100));
      setSecondsLeft(Math.ceil(Math.max(0, AUTO_CLOSE_MS - elapsed) / 1000));
    }, 50);
    const t = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [trade, onClose]);

  if (!trade) return null;

  const isWon = trade.status === 'won';
  const isBuy = trade.direction === 'buy';
  const asset = trade.tradingAsset;

  // ── CORRECT P&L ──
  const pnl = calcPnl(
    trade.stake    ?? 0,
    trade.planMultiplier ?? 0,
    trade.feeBps   ?? 200,
  );

  // What's shown as the headline result
  const headlineAmount = isWon ? pnl.netGain    : pnl.totalLoss;
  const creditedBack   = isWon ? pnl.winCredited : pnl.lossCredited;

  const accentColor = isWon ? 'var(--success)' : 'var(--danger)';

  const content = (
    <div className="relative flex flex-col overflow-hidden">
      {/* Auto-close progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border)]">
        <div className="h-full transition-[width] duration-[50ms] linear"
          style={{ width: `${progress}%`, backgroundColor: accentColor }} />
      </div>

      {/* Confetti */}
      {isWon && confetti.map(c => (
        <span key={c.id}
          className="pointer-events-none absolute top-0 h-3 w-2 rounded-sm"
          style={{ left: `${c.left}%`, backgroundColor: c.color,
            animation: `confetti-fall 1.5s ${c.delay}s ease-out forwards`, opacity: 0 }}
        />
      ))}

      <button type="button" onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors">
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row gap-0 sm:gap-6">
        {/* Left: icon + headline */}
        <div className={`flex flex-col items-center justify-center gap-3 px-6 py-8 sm:w-48 flex-shrink-0 ${
          isWon ? 'bg-[var(--success-muted)]' : 'bg-[var(--danger-muted)]'
        }`}>
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${
            isWon ? 'border-[var(--success)] bg-[var(--success-muted)]'
                  : 'border-[var(--danger)] bg-[var(--danger-muted)]'
          }`}>
            {isWon
              ? <Trophy className="w-7 h-7 text-[var(--success)]" />
              : <X      className="w-7 h-7 text-[var(--danger)]" />}
          </div>

          <h2 className={`text-xl font-bold ${isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {isWon ? 'You Won!' : 'Trade Closed'}
          </h2>

          {/* Headline: +netGain on win, -totalLoss on loss */}
          <span className={`tabular text-2xl font-bold ${isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {isWon ? '+' : '-'}{fmt(headlineAmount, asset)} {asset}
          </span>

          <p className="text-xs text-center text-[var(--text-secondary)]">
            {isWon
              ? `Net profit after ${pnl.feePct}% fee`
              : `${fmt(creditedBack, asset)} ${asset} returned`}
          </p>
        </div>

        {/* Right: detail table */}
        <div className="flex flex-col justify-between gap-4 p-5 flex-1">
          <div className="flex flex-col gap-2">
            <ResultRow label="Pair"      value={trade.pairDisplay ?? '—'} />
            <ResultRow label="Direction" value={isBuy ? 'LONG' : 'SHORT'}
              valueClass={isBuy ? 'text-[var(--success)]' : 'text-[var(--danger)]'} />
            <ResultRow label="Stake"     value={`${fmt(pnl.stake, asset)} ${asset}`}  tabular />
            <ResultRow label="Risk"      value={`${fmt(pnl.risk, asset)} ${asset}`}   tabular />
            <ResultRow label="Multiplier" value={pnl.multiplierDisplay}               tabular />
            <ResultRow label="Fee"       value={`${fmt(pnl.fee, asset)} ${asset}`}    tabular />
            <div className="my-1 h-px bg-[var(--border)]" />

            {isWon ? (
              <>
                <ResultRow label="Credited Back"
                  value={`${fmt(creditedBack, asset)} ${asset}`} tabular />
                <ResultRow label="Net Profit"
                  value={`+${fmt(pnl.netGain, asset)} ${asset}`}
                  valueClass="text-[var(--success)]" tabular bold />
              </>
            ) : (
              <>
                <ResultRow label="Credited Back"
                  value={`${fmt(creditedBack, asset)} ${asset}`} tabular />
                <ResultRow label="Net Loss"
                  value={`-${fmt(pnl.totalLoss, asset)} ${asset}`}
                  valueClass="text-[var(--danger)]" tabular bold />
              </>
            )}
          </div>

          {/* Credit note */}
          <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 border ${
            isWon ? 'border-[var(--success)]/20 bg-[var(--success-muted)]'
                  : 'border-[var(--danger)]/20 bg-[var(--danger-muted)]'
          }`}>
            <TrendingUp className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
              isWon ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`} />
            <p className="text-xs text-[var(--text-secondary)]">
              {isWon
                ? <>Profit credited to your{' '}
                    <span className="font-semibold text-[var(--success)]">{asset} Balance</span></>
                : <>{fmt(creditedBack, asset)} {asset} has been returned to your balance.</>}
            </p>
          </div>

          {/* Close controls */}
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs text-[var(--text-muted)]">Closing in {secondsLeft}s…</p>
            <button type="button" onClick={onClose}
              className={`w-full rounded-xl py-3 font-bold text-white transition-colors ${
                isWon ? 'bg-[var(--success)] hover:opacity-90' : 'bg-[var(--danger)] hover:opacity-90'
              }`}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="fixed inset-0 z-50 hidden items-center justify-center md:flex">
        <div className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in" onClick={onClose} />
        <div className="relative z-10 w-full max-w-lg animate-modal-in">
          <div className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden">
            {content}
          </div>
        </div>
      </div>
      {/* Mobile bottom sheet */}
      <div className="fixed inset-0 z-50 flex items-end md:hidden">
        <div className="absolute inset-0 bg-[var(--overlay)] animate-backdrop-in" onClick={onClose} />
        <div className="relative z-10 w-full animate-modal-in rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden">
          {content}
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value, valueClass, tabular, bold }: {
  label: string; value: string; valueClass?: string; tabular?: boolean; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} text-[var(--text-primary)]
        ${tabular ? 'tabular' : ''} ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  );
}