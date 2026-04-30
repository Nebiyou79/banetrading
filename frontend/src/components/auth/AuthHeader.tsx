// components/auth/AuthHeader.tsx
// ── BaneTrading — Auth header with per-page accent theming ──

import Link from 'next/link';
import Image from 'next/image';
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
    <div
      className="flex w-full items-center justify-between gap-3"
      style={{ animation: 'authFadeIn 0.4s 0.05s both' }}
    >
      {/* Brand wordmark */}
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 group transition-transform duration-150 hover:scale-[1.02]"
        aria-label={`${BRAND} home`}
      >
        {/* Logo image — replaces SVG badge */}
        <div
          className="relative h-8 w-8 rounded-xl overflow-hidden shrink-0 transition-transform duration-150 group-hover:scale-105"
          style={{ boxShadow: '0 0 12px var(--page-accent-muted)' }}
        >
          <Image
            src="/assets/logo.jpg"
            alt="BaneTrading"
            fill
            sizes="32px"
            className="object-cover"
          />
        </div>

        {!compact && (
          <div>
            <span className="block text-sm font-extrabold tracking-tight text-[var(--text-primary)] transition-colors duration-150">
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
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 h-8 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] focus-visible:ring-2 focus-visible:ring-[var(--page-accent)] focus-visible:outline-none transition-colors duration-150"
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