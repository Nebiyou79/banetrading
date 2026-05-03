// components/crypto/CryptoSparkline.tsx
// ── INLINE SVG SPARKLINE — Professional mini chart ──

import React, { useMemo } from 'react';

interface CryptoSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  forceColor?: 'up' | 'down';
}

export default function CryptoSparkline({ data, width = 80, height = 24, forceColor }: CryptoSparklineProps) {
  const strokeColor = useMemo(() => {
    if (forceColor) return `var(--chart-${forceColor})`;
    if (data.length < 2) return 'var(--text-muted)';
    return data[data.length - 1] >= data[0] ? 'var(--chart-up)' : 'var(--chart-down)';
  }, [data, forceColor]);

  const pathD = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const padding = 3;
    return data.map((v, i) => {
      const x = i * stepX;
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="shrink-0">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3,3" />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className="shrink-0 overflow-visible" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}