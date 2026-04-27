// hooks/useResponsive.ts
// ── SSR-safe responsive hook ──

import { useEffect, useState } from 'react';
import type { Breakpoint } from '../lib/tokens';
import { breakpoints } from '../lib/tokens';

export type { Breakpoint };

export interface ResponsiveState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

const SSR_DEFAULT: ResponsiveState = {
  breakpoint: 'desktop',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 1280,
};

function computeState(width: number): ResponsiveState {
  if (width < breakpoints.mobile) {
    return { breakpoint: 'mobile', isMobile: true, isTablet: false, isDesktop: false, width };
  }
  if (width < breakpoints.tablet) {
    return { breakpoint: 'tablet', isMobile: false, isTablet: true, isDesktop: false, width };
  }
  return { breakpoint: 'desktop', isMobile: false, isTablet: false, isDesktop: true, width };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(SSR_DEFAULT);

  useEffect(() => {
    let raf = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const update = (): void => {
      setState(computeState(window.innerWidth));
    };

    const onResize = (): void => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
      }, 80);
    };

    update();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (timeout) clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  return state;
}