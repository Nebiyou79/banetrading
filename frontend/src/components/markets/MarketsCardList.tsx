// components/markets/MarketsCardList.tsx
// ── MARKETS CARD LIST — Mobile card grid for all asset classes ──

import { useRouter } from 'next/router';
import CoinIcon from '@/components/crypto/CoinIcon';
import CryptoPriceCell from '@/components/crypto/CryptoPriceCell';
import CryptoChangePill from '@/components/crypto/CryptoChangePill';
import CryptoSparkline from '@/components/crypto/CryptoSparkline';
import ForexPairBadge from '@/components/forexMetals/ForexPairBadge';
import ForexPriceCell from '@/components/forexMetals/ForexPriceCell';
import ForexChangePill from '@/components/forexMetals/ForexChangePill';
import SpreadCell from '@/components/forexMetals/SpreadCell';
import type { MarketRow, ForexRow, AssetClass } from '@/types/markets';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface MarketsCardListProps {
  rows: (MarketRow | ForexRow)[];
  isLoading?: boolean;
  assetClass: AssetClass;
  onToggleFavorite?: (symbol: string) => void;
  favoriteSet?: Set<string>;
}

export function MarketsCardList({
  rows,
  isLoading = false,
  assetClass,
  onToggleFavorite,
  favoriteSet,
}: MarketsCardListProps) {
  const router = useRouter();
  const isCrypto = assetClass === 'crypto';

  if (isLoading) return <CardSkeleton count={isCrypto ? 6 : 4} />;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-sm text-[var(--text-muted)]">No {assetClass} pairs found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {rows.map((asset) => {
        const cryptoAsset = isCrypto ? (asset as MarketRow) : null;
        const forexAsset = !isCrypto ? (asset as ForexRow) : null;

        return (
          <div
            key={asset.symbol}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 cursor-pointer active:bg-[var(--hover-bg)] transition-colors duration-150"
            onClick={() => {
              const basePath = isCrypto ? '/markets/crypto' : '/markets/forex';
              router.push(`${basePath}/${asset.symbol}`);
            }}
            role="button"
            tabIndex={0}
          >
            {/* Top Row */}
            <div className="flex items-center justify-between">
              {isCrypto && cryptoAsset ? (
                <div className="flex items-center gap-3">
                  <CoinIcon iconUrl={(cryptoAsset as any).iconUrl} symbol={cryptoAsset.symbol} size={40} />
                  <div>
                    <div className="font-semibold text-sm text-[var(--text-primary)]">{cryptoAsset.symbol}</div>
                    <div className="text-xs text-[var(--text-muted)]">{cryptoAsset.name}</div>
                  </div>
                </div>
              ) : forexAsset ? (
                <ForexPairBadge symbol={forexAsset.symbol} display={forexAsset.display} size={32} />
              ) : null}

              <div className="flex items-center gap-2">
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.symbol); }}
                    className="text-lg"
                    style={{ color: favoriteSet?.has(asset.symbol) ? 'var(--warning)' : 'var(--text-muted)' }}
                  >
                    ★
                  </button>
                )}
                {isCrypto && cryptoAsset ? (
                  <CryptoChangePill value={cryptoAsset.change24h} />
                ) : forexAsset ? (
                  <ForexChangePill value={forexAsset.change24h} />
                ) : null}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-3">
              {isCrypto && cryptoAsset ? (
                <>
                  <CryptoPriceCell value={cryptoAsset.price} className="text-xl font-bold" />
                  <CryptoSparkline data={(cryptoAsset as any).sparkline7d || []} width={90} height={32} />
                </>
              ) : forexAsset ? (
                <>
                  <ForexPriceCell value={forexAsset.price} decimals={forexAsset.decimals} className="text-xl font-bold" />
                  <div className="text-xs text-[var(--text-muted)]">
                    Spread: <SpreadCell high={forexAsset.high24h} low={forexAsset.low24h} decimals={forexAsset.decimals} />
                  </div>
                </>
              ) : null}
            </div>

            {/* Trade Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/trade?symbol=${asset.symbol}`);
              }}
              className="mt-3 w-full py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-150"
            >
              Trade {isCrypto ? cryptoAsset?.symbol : forexAsset?.symbol}
            </button>
          </div>
        );
      })}
    </div>
  );
}