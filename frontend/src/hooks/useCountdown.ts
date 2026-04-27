// hooks/useCountdown.ts
// ── Seconds countdown, SSR-safe ──

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CountdownState {
  secondsLeft: number;
  isDone: boolean;
  restart: (seconds?: number) => void;
}

export function useCountdown(initialSeconds = 0): CountdownState {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef = useRef<number>(0);

  const clearTimer = (): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback((seconds: number) => {
    clearTimer();
    if (seconds <= 0) {
      setSecondsLeft(0);
      return;
    }
    deadlineRef.current = Date.now() + seconds * 1000;
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) clearTimer();
    }, 250);
  }, []);

  useEffect(() => {
    if (initialSeconds > 0) start(initialSeconds);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = useCallback((seconds?: number) => {
    start(seconds ?? initialSeconds);
  }, [initialSeconds, start]);

  return {
    secondsLeft,
    isDone: secondsLeft <= 0,
    restart,
  };
}