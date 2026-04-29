// components/markets/CoinIcon.tsx
// ── COIN ICON WITH CSS FALLBACK BADGE ──

'use client';

import React, { useState } from 'react';

interface CoinIconProps {
  iconUrl: string | null;
  symbol: string;
  size?: number;
  color?: string;
}

// ── Simple hash-to-color for fallback badges ──
function hashColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

export default function CoinIcon({
  iconUrl,
  symbol,
  size = 32,
  color,
}: CoinIconProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = iconUrl && !imgError;
  const fallbackColor = color || hashColor(symbol);
  const fontSize = Math.max(size * 0.45, 12);

  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={iconUrl}
          alt={`${symbol} icon`}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : (
        /* ── CSS-only circular badge ── */
        <div
          className="w-full h-full flex items-center justify-center rounded-full font-bold text-[var(--text-inverse)] select-none"
          style={{ backgroundColor: fallbackColor, fontSize }}
        >
          {symbol.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}