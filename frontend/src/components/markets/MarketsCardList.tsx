/* eslint-disable @typescript-eslint/no-explicit-any */
// components/markets/MarketsCardList.tsx
// ── MOBILE CARD GRID (CRYPTO + FX/METALS) ──

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { MarketRow, AssetClass } from '@/types/markets';
import { getAssetMeta } from '@/constants/assetClasses';
import CoinIcon from './CoinIcon';
import PriceCell from './PriceCell';
import ChangePill from './ChangePill';
import Sparkline from './Sparkline';
import ForexPairBadge from './ForexPairBadge';
import SpreadCell from './SpreadCell';

interface MarketsCardListProps {
  rows: MarketRow[];
  isLoading?: boolean;
  assetClass?: AssetClass;
  onToggleFavorite?: (symbol: string) => void;
  favoriteSet?: Set<string>;
}

export default function MarketsCardList({
  rows,
  isLoading = false,
  assetClass = 'crypto',
  onToggleFavorite,
  favoriteSet,
}: MarketsCardListProps) {
  const router = useRouter();
  const skeletonCards = Array.from({ length: 6 }, (_, i) => i);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {skeletonCards.map(i => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--bg-muted)] rounded-full" />
                <div><div className="w-16 h-4 bg-[var(--bg-muted)] rounded mb-1" /><div className="w-20 h-3 bg-[var(--bg-muted)] rounded" /></div>
              </div>
              <div className="w-16 h-6 bg-[var(--bg-muted)] rounded-full" />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="w-24 h-6 bg-[var(--bg-muted)] rounded" />
              <div className="w-20 h-6 bg-[var(--bg-muted)] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <div className="py-16 text-center text-[var(--text-muted)]"><p className="text-sm">No data available</p></div>;
  }

  return (
    <div className="space-y-3">
      {rows.map(row => {
        const meta = assetClass !== 'crypto' ? getAssetMeta(row.symbol) : null;
        const decimals = meta?.decimals ?? 2;
        return (
          <div
            key={row.symbol}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 cursor-pointer active:bg-[var(--hover-bg)] transition-colors duration-150"
            onClick={() => router.push(`/markets/${row.symbol}`)}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              {assetClass === 'crypto' ? (
                <div className="flex items-center gap-3">
                  <CoinIcon iconUrl={(row as any).iconUrl} symbol={row.symbol} size={40} />
                  <div>
                    <div className="font-semibold text-sm text-[var(--text-primary)]">{row.symbol}</div>
                    <div className="text-xs text-[var(--text-muted)]">{row.name}</div>
                  </div>
                </div>
              ) : (
                <ForexPairBadge symbol={row.symbol} display={meta?.display || row.symbol} size={36} />
              )}
              <div className="flex items-center gap-2">
                {assetClass === 'crypto' && onToggleFavorite && (
                  <button
                    onClick={e => { e.stopPropagation(); onToggleFavorite(row.symbol); }}
                    className="text-lg"
                    style={{ color: favoriteSet?.has(row.symbol) ? 'var(--warning)' : 'var(--text-muted)' }}
                    aria-label={favoriteSet?.has(row.symbol) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favoriteSet?.has(row.symbol) ? '★' : '☆'}
                  </button>
                )}
                <ChangePill value={row.change24h} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <PriceCell value={row.price} className="text-xl font-bold" decimals={assetClass !== 'crypto' ? decimals : undefined} />
              {assetClass === 'crypto' ? (
                <Sparkline data={(row as any).sparkline7d || []} width={90} height={32} />
              ) : (
                <span className="text-xs text-[var(--text-muted)]">
                  Spread: <SpreadCell high={row.high24h} low={row.low24h} decimals={decimals} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}