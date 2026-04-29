// hooks/useConversionQuote.ts
// ── DEBOUNCED CONVERSION QUOTE HOOK ──

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversionService } from '@/services/conversionService';
import type { Currency, ConversionQuote } from '@/types/convert';

interface UseConversionQuoteParams {
  from: Currency | null;
  to: Currency | null;
  fromAmount: number;
}

export interface UseConversionQuoteReturn {
  quote: ConversionQuote | null;
  isLoading: boolean;
  isStale: boolean;
  secondsToRefresh: number;
  error: string | null;
  refetch: () => void;
}

export function useConversionQuote({
  from,
  to,
  fromAmount,
}: UseConversionQuoteParams): UseConversionQuoteReturn {
  const [debouncedAmount, setDebouncedAmount] = useState(fromAmount);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounce fromAmount changes by 300ms ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedAmount(fromAmount);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fromAmount]);

  const enabled = !!from && !!to && from !== to && debouncedAmount > 0;

  const query = useQuery<ConversionQuote>({
    queryKey: ['convert-quote', from, to, debouncedAmount],
    queryFn: () =>
      conversionService.getQuote({
        from: from!,
        to: to!,
        fromAmount: debouncedAmount,
      }),
    enabled,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  // ── Countdown to next refresh ──
  const [secondsToRefresh, setSecondsToRefresh] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !query.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSecondsToRefresh(10);
      return;
    }
    setSecondsToRefresh(10);
    timerRef.current = setInterval(() => {
      setSecondsToRefresh(prev => {
        if (prev <= 1) return 10;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, query.dataUpdatedAt]);

  const isStale = secondsToRefresh <= 2;

  return {
    quote: query.data ?? null,
    isLoading: query.isLoading,
    isStale,
    secondsToRefresh,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
}