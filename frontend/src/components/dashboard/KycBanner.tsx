// components/dashboard/KycBanner.tsx
// ── Persistent (per-session) prompt to complete KYC ──

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Pill, PillTone } from '@/components/ui/Pill';
import type { KycStatus } from '@/types/profile';

const STORAGE_KEY = 'pbt_kyc_banner_dismissed';

export interface KycBannerProps {
  status: KycStatus;
  tier: number;
}

interface BannerCopy {
  title: string;
  body: string;
  cta: string;
  tone: PillTone;
  pillLabel: string;
}

function copyForStatus(status: KycStatus): BannerCopy | null {
  if (status === 'approved') return null;
  if (status === 'pending') {
    return {
      title:     'Verification in review',
      body:      'Your KYC submission is being reviewed. This usually takes a few hours.',
      cta:       'View status',
      tone:      'warning',
      pillLabel: 'Pending',
    };
  }
  if (status === 'rejected') {
    return {
      title:     'Verification rejected',
      body:      'Your last KYC submission was rejected. Resubmit with updated documents to continue.',
      cta:       'Resubmit',
      tone:      'danger',
      pillLabel: 'Rejected',
    };
  }
  return {
    title:     'Verify your identity',
    body:      'Complete KYC to unlock higher deposit, withdrawal, and trading limits.',
    cta:       'Start KYC',
    tone:      'accent',
    pillLabel: 'Not started',
  };
}

export function KycBanner({ status, tier }: KycBannerProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  });

  const copy = copyForStatus(status);
  if (!copy || dismissed) return null;

  const handleDismiss = (): void => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    }
  };

  return (
    /*
     * Banner shell — border tint driven by KYC status tone:
     *   danger  → var(--error-muted)   red rim
     *   warning → var(--warning-muted) yellow rim
     *   accent  → var(--primary-muted) gold rim
     *
     * bg-[var(--card)] provides the elevated surface in both themes.
     */
    <div
      className={cn(
        `relative flex flex-col gap-3 rounded-card
         border bg-[var(--card)]
         p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5
         shadow-md`,
        copy.tone === 'danger'  && 'border-[var(--error-muted)]',
        copy.tone === 'warning' && 'border-[var(--warning-muted)]',
        copy.tone === 'accent'  && 'border-[var(--primary-muted)]',
      )}
      role="status"
    >
      {/* Left: icon + copy */}
      <div className="flex items-start gap-3">
        {/*
         * Icon badge:
         *   danger  → bg-[var(--error-muted)]   text-[var(--error)]
         *   warning → bg-[var(--warning-muted)] text-[var(--warning)]
         *   accent  → bg-[var(--primary-muted)] text-[var(--primary)]
         */}
        <span
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            copy.tone === 'danger'  && 'bg-[var(--error-muted)]   text-[var(--error)]',
            copy.tone === 'warning' && 'bg-[var(--warning-muted)] text-[var(--warning)]',
            copy.tone === 'accent'  && 'bg-[var(--primary-muted)] text-[var(--primary)]',
          )}
        >
          <ShieldAlert className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {copy.title}
            </h3>
            <Pill tone={copy.tone} size="xs">{copy.pillLabel}</Pill>
            {tier > 0 && <Pill tone="neutral" size="xs">Tier {tier}</Pill>}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{copy.body}</p>
        </div>
      </div>

      {/* Right: CTA + dismiss */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href="/kyc"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-button h-9 px-3 text-xs font-medium transition-colors duration-150',
            /*
             * CTA button variants:
             *   accent  → solid gold fill  (primary action)
             *   warning → ghost yellow rim (softer signal)
             *   danger  → solid red fill   (urgent action)
             */
            copy.tone === 'accent'  &&
              'bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-hover)]',
            copy.tone === 'warning' &&
              'border border-[var(--warning-muted)] text-[var(--warning)] hover:bg-[var(--warning-muted)]',
            copy.tone === 'danger'  &&
              'bg-[var(--error)] text-white hover:brightness-110',
          )}
        >
          {copy.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="
            inline-flex h-9 w-9 items-center justify-center rounded-button
            text-[var(--text-muted)]
            hover:text-[var(--text-primary)]
            hover:bg-[var(--hover-bg)]
            transition-colors duration-150
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
