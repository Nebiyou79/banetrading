// components/landing/WelcomeAnimation.tsx
// ── Post-login intro: fade-in stages, auto-redirect at 1.2s ──

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeStats } from './WelcomeStats';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'BaneTrading';
const TOTAL_MS = 1200;

/**
 * Logo mark — gradient uses:
 *   var(--accent)       → gold/indigo accent
 *   var(--info)         → blue accent
 *   var(--text-inverse) → contrast for text
 */
function BaneLogoMark(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
      <defs>
        <linearGradient id="welcome-brand-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="var(--accent)"   />
          <stop offset="100%" stopColor="var(--info)"  />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="72" height="72" rx="18" fill="url(#welcome-brand-grad)" />
      {/* Stylized B + chart bar */}
      <polyline
        points="22,22 28,36 34,30 42,44 54,28"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="22,22 28,36 34,30 42,44 54,28"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* B letter overlay */}
      <text
        x="40"
        y="62"
        textAnchor="middle"
        fontSize="14"
        fontWeight="900"
        fill="var(--text-inverse)"
        fontFamily="system-ui, sans-serif"
        style={{ opacity: 0.95 }}
      >
        BT
      </text>
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

      {/* Radial glow — accent color bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 35%, var(--accent-muted) 0%, transparent 65%)',
        }}
      />

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[15%] left-[15%] h-64 w-64 rounded-full blur-[100px] opacity-10"
          style={{ background: 'var(--accent)', animation: 'blobFloat 12s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[20%] right-[15%] h-48 w-48 rounded-full blur-[80px] opacity-8"
          style={{ background: 'var(--info)', animation: 'blobFloat 15s 3s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute top-[50%] left-[45%] h-36 w-36 rounded-full blur-[60px] opacity-6"
          style={{ background: 'var(--success)', animation: 'blobFloat 10s 6s ease-in-out infinite' }}
        />
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        className="
          absolute right-5 top-5 z-10 rounded-xl
          border border-[var(--border)]
          bg-[var(--bg-muted)]
          px-3 py-1.5 text-xs font-medium
          text-[var(--text-secondary)]
          hover:text-[var(--text-primary)]
          hover:border-[var(--border-strong)]
          hover:bg-[var(--bg-card-hover)]
          hover:shadow-[0_2px_12px_var(--accent-muted)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
          transition-all duration-150
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
              <BaneLogoMark />
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
                 *   text-[var(--accent)] → indigo/violet
                 */}
                <span className="text-[var(--accent)]">{firstName}</span>
              </h1>
            </motion.div>

            <WelcomeStats />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}