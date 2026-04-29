// components/auth/AuthHeader.tsx
// ── BaneTrading — Auth header with per-page accent theming ──

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import type { PageTheme } from './AuthLayout';

const BRAND = 'BaneTrading';

export interface AuthHeaderProps {
  showBackLink?: boolean;
  pageTheme?: PageTheme;
  compact?: boolean;
}

export function AuthHeader({
  showBackLink = true,
  pageTheme = 'indigo',
  compact = false,
}: AuthHeaderProps): JSX.Element {
  return (
    <div className="flex w-full items-center justify-between gap-3">

      {/* Brand wordmark */}
      <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label={`${BRAND} home`}>
        {/* Logo badge — uses page-accent var */}
        <div
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shrink-0 transition-transform duration-150 group-hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--page-accent) 0%, var(--page-accent-hover) 100%)',
            boxShadow: '0 0 12px var(--page-accent-muted)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <polyline
              points="6,21 10,14 14,18 19,10 26,14"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            <polyline
              points="6,21 10,14 14,18 19,10 26,14"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>

        {!compact && (
          <div>
            <span
              className="block text-sm font-extrabold tracking-tight text-[var(--text-primary)] transition-colors duration-150"
              style={{ }}
            >
              {BRAND}
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
              Pro Trading
            </span>
          </div>
        )}
        {compact && (
          <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)]">
            {BRAND}
          </span>
        )}
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {showBackLink && (
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 h-8 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] transition-colors duration-150"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Link>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
