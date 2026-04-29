// components/markets/CoinSummaryCard.tsx
// ── COIN DETAIL HEADER CARD ──

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { MarketRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import CoinIcon from './CoinIcon';
import PriceCell from './PriceCell';
import ChangePill from './ChangePill';

interface CoinSummaryCardProps {
  row: MarketRow;
}

export default function CoinSummaryCard({ row }: CoinSummaryCardProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div
        className={`
          flex
          ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'}
        `}
      >
        {/* ── Left: Icon + Symbol + Price ── */}
        <div className="flex items-center gap-4">
          <CoinIcon iconUrl={row.iconUrl} symbol={row.symbol} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] tabular">
                {row.name}
              </h2>
              <span className="text-sm text-[var(--text-muted)] tabular">
                {row.symbol}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <PriceCell
                value={row.price}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              />
              <ChangePill value={row.change24h} className="text-base px-3 py-1" />
            </div>
          </div>
        </div>

        {/* ── Right: Trade Now button ── */}
        <button
          className={`
            px-6 py-3 rounded-xl font-semibold text-base
            bg-[var(--accent)] text-[var(--text-inverse)]
            hover:opacity-90 active:scale-[0.98]
            transition-all duration-150
            ${isMobile ? 'w-full' : 'flex-shrink-0'}
          `}
          onClick={() => router.push(`/trade?symbol=${row.symbol}`)}
        >
          Trade Now
        </button>
      </div>
    </div>
  );
}