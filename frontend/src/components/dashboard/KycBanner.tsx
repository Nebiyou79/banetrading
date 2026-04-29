/* eslint-disable react-hooks/set-state-in-effect */
// components/dashboard/KycBanner.tsx
// ── Persistent (per-session) prompt to complete KYC ──

import { useEffect, useState } from 'react';
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
      title: 'Verification in review',
      body: 'Your KYC submission is being reviewed. This usually takes a few hours.',
      cta: 'View status',
      tone: 'warning',
      pillLabel: 'Pending',
    };
  }
  if (status === 'rejected') {
    return {
      title: 'Verification rejected',
      body: 'Your last KYC submission was rejected. Resubmit with updated documents to continue.',
      cta: 'Resubmit',
      tone: 'danger',
      pillLabel: 'Rejected',
    };
  }
  return {
    title: 'Verify your identity',
    body: 'Complete KYC to unlock higher deposit, withdrawal, and trading limits.',
    cta: 'Start KYC',
    tone: 'accent',
    pillLabel: 'Not started',
  };
}

export function KycBanner({ status, tier }: KycBannerProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);
  const copy = copyForStatus(status);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === '1') setDismissed(true);
  }, []);

  if (!copy || dismissed) return null;

  const handleDismiss = (): void => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-card border bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-card',
        copy.tone === 'danger'  && 'border-danger/40',
        copy.tone === 'warning' && 'border-warning/40',
        copy.tone === 'accent'  && 'border-accent/40',
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          copy.tone === 'danger'  && 'bg-danger/10 text-danger',
          copy.tone === 'warning' && 'bg-warning/10 text-warning',
          copy.tone === 'accent'  && 'bg-accent/10 text-accent',
        )}>
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">{copy.title}</h3>
            <Pill tone={copy.tone} size="xs">{copy.pillLabel}</Pill>
            {tier > 0 && <Pill tone="neutral" size="xs">Tier {tier}</Pill>}
          </div>
          <p className="mt-1 text-xs text-text-secondary">{copy.body}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {/* Goes to the KYC tab in settings. */}
        <Link
          href="/settings/kyc"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-button h-9 px-3 text-xs font-medium transition-colors',
            copy.tone === 'accent'  && 'bg-accent text-[#0B0E11] hover:bg-accent-hover',
            copy.tone === 'warning' && 'border border-warning/40 text-warning hover:bg-warning/10',
            copy.tone === 'danger'  && 'bg-danger text-white hover:brightness-110',
          )}
        >
          {copy.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="inline-flex h-9 w-9 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}