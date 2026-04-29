// components/markets/Sparkline.tsx
// ── INLINE SVG SPARKLINE ──

import React, { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  forceColor?: 'up' | 'down';
}

export default function Sparkline({
  data,
  width = 80,
  height = 24,
  forceColor,
}: SparklineProps) {
  const strokeColor = useMemo(() => {
    if (forceColor) {
      return `var(--chart-${forceColor})`;
    }
    if (data.length < 2) return 'var(--text-muted)';
    const isUp = data[data.length - 1] >= data[0];
    return isUp ? 'var(--chart-up)' : 'var(--chart-down)';
  }, [data, forceColor]);

  const pathD = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const xStep = width / (data.length - 1);

    const points = data.map((value, i) => {
      const x = i * xStep;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return points.join(' ');
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="flex-shrink-0">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--text-muted)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className="flex-shrink-0 overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}