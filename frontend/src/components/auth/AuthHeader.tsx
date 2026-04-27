// components/auth/AuthHeader.tsx
// ── Compact header used inside the auth column (and on mobile) ──

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../../components/theme/ThemeToggle';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export interface AuthHeaderProps {
  showBackLink?: boolean;
}

export function AuthHeader({ showBackLink = true }: AuthHeaderProps): JSX.Element {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      {/* Brand wordmark */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 group"
        aria-label={`${BRAND} home`}
      >
        {/*
         * Logo badge — uses CSS var mapped to colors.dark.primary / colors.light.primary
         * via Tailwind's [var(--primary)] or your global CSS vars injection.
         * Color: var(--primary) = gold[400] dark | gold[500] light
         * Text on badge: var(--text-inverse) = near-black for legibility on gold
         */}
        <span
          className="
            inline-flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm
            bg-[var(--primary)] text-[var(--text-inverse)]
            transition-transform duration-150 group-hover:scale-105
          "
          aria-hidden="true"
        >
          P
        </span>
        <span
          className="
            text-sm font-semibold tracking-tight
            text-[var(--text-primary)]
            group-hover:text-[var(--primary)]
            transition-colors duration-150
          "
        >
          {BRAND}
        </span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {showBackLink && (
          <Link
            href="/"
            className="
              hidden sm:inline-flex items-center gap-1.5 rounded-button
              border border-[var(--border)]
              bg-[var(--surface)]
              px-3 h-9 text-xs
              text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              hover:border-[var(--border-strong)]
              hover:bg-[var(--hover-bg)]
              transition-colors duration-150
            "
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
