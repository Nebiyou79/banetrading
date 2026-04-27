// hooks/useCountUp.ts
// ── Number count-up animation ──

import { useEffect, useRef, useState } from 'react';

export interface UseCountUpOptions {
  duration?: number;   // ms
  decimals?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(target: number, opts: UseCountUpOptions = {}): number {
  const { duration = 300, decimals = 2 } = opts;
  const [value, setValue] = useState<number>(target);
  const frame = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = performance.now();
    const step = (now: number): void => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = fromRef.current + (target - fromRef.current) * eased;
      const factor = 10 ** decimals;
      setValue(Math.round(next * factor) / factor);
      if (t < 1) {
        frame.current = requestAnimationFrame(step);
      }
    };
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, decimals]);

  return value;
}