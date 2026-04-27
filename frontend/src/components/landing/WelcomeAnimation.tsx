// components/landing/WelcomeAnimation.tsx
// ── Post-login intro: fade-in stages, auto-redirect at 1.2s ──

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeStats } from './WelcomeStats';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';
const TOTAL_MS = 1200;

/**
 * Logo mark — gradient uses:
 *   var(--primary)       → gold[400] dark | gold[500] light
 *   var(--secondary)     → amber[400] dark | amber[500] light
 *   var(--text-inverse)  → near-black for P letter contrast
 */
function PrimeLogo(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="var(--primary)"   />
          <stop offset="100%" stopColor="var(--secondary)"  />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="72" height="72" rx="18" fill="url(#brand-grad)" />
      <path
        d="M 28 22 H 46 a 12 12 0 1 1 0 24 H 32 v 12 H 26 V 22 z M 32 28 v 12 h 14 a 6 6 0 1 0 0 -12 H 32 z"
        fill="var(--text-inverse)"
      />
    </svg>
  );
}

export function WelcomeAnimation(): JSX.Element {
  const router  = useRouter();
  const { user } = useAuth();
  const [exiting, setExiting] = useState(false);

  const firstName = (user?.displayName || user?.name || 'trader').split(' ')[0];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(() => { router.replace('/dashboard'); }, 220);
    }, TOTAL_MS);
    return () => window.clearTimeout(id);
  }, [router]);

  const onSkip = (): void => {
    setExiting(true);
    router.replace('/dashboard');
  };

  return (
    /*
     * Full-screen stage:
     *   bg-[var(--background)]    → deep navy dark | soft light
     */
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)]">

      {/* Radial glow — primary color bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 35%, var(--primary-muted) 0%, transparent 65%)',
        }}
      />

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        className="
          absolute right-5 top-5 z-10 rounded-button
          border border-[var(--border)]
          bg-[var(--surface)]
          px-3 py-1.5 text-xs
          text-[var(--text-secondary)]
          hover:text-[var(--text-primary)]
          hover:border-[var(--border-strong)]
          hover:bg-[var(--hover-bg)]
          transition-colors duration-150
        "
      >
        Skip
      </button>

      <AnimatePresence>
        {!exiting && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-center gap-5 px-6"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
            >
              <PrimeLogo />
            </motion.div>

            {/* Brand + welcome copy */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {BRAND}
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                Welcome back,{' '}
                {/*
                 * First-name highlight:
                 *   text-[var(--primary)] → gold
                 */}
                <span className="text-[var(--primary)]">{firstName}</span>
              </h1>
            </motion.div>

            <WelcomeStats />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
