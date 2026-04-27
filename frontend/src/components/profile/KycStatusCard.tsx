// components/profile/KycStatusCard.tsx
// ── KYC status display + CTA ──

import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { Pill, PillTone } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import type { KycStatus, UserProfile } from '@/types/profile';

export interface KycStatusCardProps {
  user: UserProfile;
}

interface StatusVisual {
  tone: PillTone;
  label: string;
  icon: JSX.Element;
  headline: string;
  body: string;
  cta: string;
}

function visualFor(status: KycStatus): StatusVisual {
  if (status === 'approved') {
    return {
      tone: 'success',
      label: 'Verified',
      icon: <CheckCircle2 className="h-4 w-4" />,
      headline: 'Identity verified',
      body: 'Your identity has been verified. You have access to higher deposit, withdrawal, and trading limits.',
      cta: 'View documents',
    };
  }
  if (status === 'pending') {
    return {
      tone: 'warning',
      label: 'Pending review',
      icon: <Clock className="h-4 w-4" />,
      headline: 'Verification in review',
      body: 'Your KYC submission is being reviewed. This usually takes a few hours.',
      cta: 'View status',
    };
  }
  if (status === 'rejected') {
    return {
      tone: 'danger',
      label: 'Rejected',
      icon: <XCircle className="h-4 w-4" />,
      headline: 'Verification rejected',
      body: 'Your last submission was rejected. Please review the feedback and resubmit with updated documents.',
      cta: 'Resubmit',
    };
  }
  return {
    tone: 'neutral',
    label: 'Not started',
    icon: <ShieldAlert className="h-4 w-4" />,
    headline: 'Verify your identity',
    body: 'Complete identity verification to unlock higher limits and access all platform features.',
    cta: 'Start KYC',
  };
}

export function KycStatusCard({ user }: KycStatusCardProps): JSX.Element {
  const v = visualFor(user.kycStatus);
  const submittedAt = user.updatedAt ? formatDate(user.updatedAt) : '—';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full
            ${v.tone === 'success'  ? 'bg-success/10 text-success'  : ''}
            ${v.tone === 'warning'  ? 'bg-warning/10 text-warning'  : ''}
            ${v.tone === 'danger'   ? 'bg-danger/10 text-danger'    : ''}
            ${v.tone === 'neutral'  ? 'bg-muted text-text-muted'    : ''}
          `}>
            {v.icon}
          </span>
          <div>
            <h3 className="text-base font-semibold text-text-primary">{v.headline}</h3>
            <p className="mt-1 text-sm text-text-secondary leading-relaxed max-w-xl">{v.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Pill tone={v.tone} leadingIcon={v.icon}>{v.label}</Pill>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoTile label="Status" value={v.label} />
        <InfoTile label="Tier" value={user.kycTier > 0 ? `Tier ${user.kycTier}` : 'None'} />
        <InfoTile label="Last updated" value={submittedAt} />
      </div>

      <div className="flex items-center justify-end pt-2">
        {/* TODO: KYC module page — placeholder route for now */}
        <Link href="/kyc">
          <Button
            variant={user.kycStatus === 'approved' ? 'secondary' : 'primary'}
            trailingIcon={<ArrowRight className="h-4 w-4" />}
          >
            {v.cta}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-input border border-border bg-muted px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-text-primary">{value}</div>
    </div>
  );
}