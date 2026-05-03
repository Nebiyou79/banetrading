// components/markets/AssetRow.tsx
// ── ASSET ROW — Reusable row for crypto/forex/metals ──

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

interface AssetRowProps {
  asset: MarketRow | ForexRow;
  assetClass: AssetClass;
  onFavorite?: (symbol: string) => void;
  isFavorite?: boolean;
}

export function AssetRow({ asset, assetClass, onFavorite, isFavorite }: AssetRowProps) {
  const router = useRouter();

  const handleClick = () => {
    const basePath = assetClass === 'crypto' ? '/markets/crypto' : '/markets/forex';
    router.push(`${basePath}/${asset.symbol}`);
  };

  const handleTrade = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/trade?symbol=${asset.symbol}`);
  };

  const isCrypto = assetClass === 'crypto';
  const cryptoAsset = asset as MarketRow;
  const forexAsset = asset as ForexRow;

  return (
    <tr
      className="border-t border-[var(--border)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors duration-150"
      onClick={handleClick}
    >
      {/* Favorite */}
      {onFavorite && (
        <td className="py-3 px-4" onClick={(e) => { e.stopPropagation(); onFavorite(asset.symbol); }}>
          <button className="text-lg transition-colors" style={{ color: isFavorite ? 'var(--warning)' : 'var(--text-muted)' }}>
            {isFavorite ? '★' : '☆'}
          </button>
        </td>
      )}

      {/* Asset Info */}
      <td className="py-3 px-4">
        {isCrypto ? (
          <div className="flex items-center gap-3">
            <CoinIcon iconUrl={(cryptoAsset as any).iconUrl} symbol={cryptoAsset.symbol} size={32} />
            <div>
              <div className="font-semibold text-sm text-[var(--text-primary)] tabular">{cryptoAsset.symbol}</div>
              <div className="text-xs text-[var(--text-muted)]">{cryptoAsset.name}</div>
            </div>
          </div>
        ) : (
          <ForexPairBadge symbol={forexAsset.symbol} display={forexAsset.display} size={28} />
        )}
      </td>

      {/* Price */}
      <td className="py-3 px-4">
        {isCrypto ? (
          <CryptoPriceCell value={cryptoAsset.price} className="text-sm font-semibold" />
        ) : (
          <ForexPriceCell value={forexAsset.price} decimals={forexAsset.decimals} className="text-sm font-semibold" />
        )}
      </td>

      {/* 24h Change */}
      <td className="py-3 px-4">
        {isCrypto ? (
          <CryptoChangePill value={cryptoAsset.change24h} />
        ) : (
          <ForexChangePill value={forexAsset.change24h} />
        )}
      </td>

      {/* Volume / High */}
      <td className="py-3 px-4">
        {isCrypto ? (
          <span className="tabular text-sm text-[var(--text-secondary)]">{formatCompact(cryptoAsset.volume24h)}</span>
        ) : (
          <ForexPriceCell value={forexAsset.high24h} decimals={forexAsset.decimals} className="text-sm" />
        )}
      </td>

      {/* Low / Spread */}
      <td className="py-3 px-4">
        {isCrypto ? (
          <CryptoPriceCell value={cryptoAsset.low24h} className="text-sm" />
        ) : (
          <SpreadCell high={forexAsset.high24h} low={forexAsset.low24h} decimals={forexAsset.decimals} />
        )}
      </td>

      {/* Sparkline (crypto only) */}
      {isCrypto && (
        <td className="py-3 px-4">
          <CryptoSparkline data={(cryptoAsset as any).sparkline7d || []} width={80} height={28} />
        </td>
      )}

      {/* Trade Button */}
      <td className="py-3 px-4 text-right">
        <button
          onClick={handleTrade}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          Trade
        </button>
      </td>
    </tr>
  );
}

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}