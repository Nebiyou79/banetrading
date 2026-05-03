// components/forexMetals/ForexSummaryCard.tsx
// ── FOREX SUMMARY CARD — Detail page header ──

import React from 'react';
import { useRouter } from 'next/router';
import type { ForexRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import ForexPairBadge from './ForexPairBadge';
import ForexPriceCell from './ForexPriceCell';
import ForexChangePill from './ForexChangePill';

interface ForexSummaryCardProps {
  row: ForexRow;
}

export default function ForexSummaryCard({ row }: ForexSummaryCardProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'}`}>
        {/* Left: Badge + Price */}
        <div className="flex items-center gap-4">
          <ForexPairBadge symbol={row.symbol} display={row.display} size={44} showName={false} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{row.name}</h2>
              <span className="text-sm text-[var(--text-muted)] tabular">{row.display}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <ForexPriceCell
                value={row.price}
                decimals={row.decimals}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              />
              <ForexChangePill value={row.change24h} className="text-base px-3 py-1" />
            </div>
          </div>
        </div>

        {/* Right: Trade CTA */}
        <button
          onClick={() => router.push(`/trade?symbol=${row.symbol}`)}
          className={`px-6 py-3 rounded-xl font-semibold text-base bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-150 ${
            isMobile ? 'w-full' : 'shrink-0'
          }`}
        >
          Trade Now
        </button>
      </div>
    </div>
  );
}