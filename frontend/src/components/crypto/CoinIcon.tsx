// components/crypto/CoinIcon.tsx
// ── COIN ICON — Image with CSS fallback badge ──

import React, { useState } from 'react';

interface CoinIconProps {
  iconUrl: string | null;
  symbol: string;
  size?: number;
  color?: string;
}

function hashColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
}

export default function CoinIcon({ iconUrl, symbol, size = 32, color }: CoinIconProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = iconUrl && !imgError;
  const fallbackColor = color || hashColor(symbol);
  const fontSize = Math.max(size * 0.42, 11);

  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden shadow-sm"
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
        <div
          className="w-full h-full flex items-center justify-center rounded-full font-bold text-white select-none"
          style={{ backgroundColor: fallbackColor, fontSize }}
        >
          {symbol.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}