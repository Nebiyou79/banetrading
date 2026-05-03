// components/crypto/CoinSummaryCard.tsx
// ── COIN SUMMARY CARD — Professional detail header ──

import React from 'react';
import { useRouter } from 'next/router';
import type { MarketRow } from '@/types/markets';
import { useResponsive } from '@/hooks/useResponsive';
import CoinIcon from './CoinIcon';
import CryptoPriceCell from './CryptoPriceCell';
import CryptoChangePill from './CryptoChangePill';

interface CoinSummaryCardProps {
  row: MarketRow;
}

export default function CoinSummaryCard({ row }: CoinSummaryCardProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between'}`}>
        {/* Left: Icon + Name + Price */}
        <div className="flex items-center gap-4">
          <CoinIcon iconUrl={(row as any).iconUrl} symbol={row.symbol} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{row.name}</h2>
              <span className="text-sm text-[var(--text-muted)] tabular">{row.symbol}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <CryptoPriceCell
                value={row.price}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              />
              <CryptoChangePill value={row.change24h} className="text-base px-3 py-1" />
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