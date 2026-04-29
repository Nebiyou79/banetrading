// components/kyc/KycLevelCard.tsx
// ── Per-level KYC status card ──

import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KycStatusPill } from '@/components/ui/StatusPill';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import type { KycStatusValue } from '@/types/kyc';

export interface KycLevelCardProps {
  level: 1 | 2 | 3;
  title: string;
  description: string;
  status: KycStatusValue;
  submittedSummary?: ReactNode;
  rejectionReason?: string;
  disabled?: boolean;
  disabledReason?: string;
  onStart?: () => void;
}

export function KycLevelCard({
  level,
  title,
  description,
  status,
  submittedSummary,
  rejectionReason,
  disabled = false,
  disabledReason,
  onStart,
}: KycLevelCardProps): JSX.Element {
  const ctaLabel =
    status === 'rejected'      ? 'Resubmit' :
    status === 'not_submitted' ? 'Start Verification' :
    null;

  const showCta = !!onStart && !!ctaLabel && !disabled;
  const isPending  = status === 'pending';
  const isApproved = status === 'approved';

  return (
    <Card
      className={cn('transition-opacity', disabled && 'opacity-60')}
      padded={false}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              <span>Level {level}</span>
            </div>
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xl">{description}</p>
          </div>
          <KycStatusPill status={status} />
        </div>

        {/* Approved summary */}
        {isApproved && submittedSummary && (
          <div className="rounded-input border border-border-subtle bg-muted px-3 py-2.5 text-xs text-text-secondary">
            {submittedSummary}
          </div>
        )}

        {/* Pending */}
        {isPending && (
          <div className="rounded-input border border-warning/40 bg-warning-muted px-3 py-2.5 text-xs text-warning">
            Awaiting review — typically 1–3 business days.
          </div>
        )}

        {/* Rejected */}
        {status === 'rejected' && rejectionReason && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-input border border-danger/40 bg-danger-muted px-3 py-2.5 text-xs text-danger"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <span className="font-semibold">Rejected: </span>
              <span>{rejectionReason}</span>
            </div>
          </div>
        )}

        {/* CTA */}
        {(showCta || disabled) && (
          <div className="flex items-center justify-end pt-1">
            {disabled ? (
              <Tooltip label={disabledReason || 'Not available yet'} side="top">
                <span>
                  <Button variant="primary" disabled>
                    {ctaLabel ?? 'Start Verification'}
                  </Button>
                </span>
              </Tooltip>
            ) : (
              showCta && (
                <Button variant="primary" onClick={onStart}>
                  {ctaLabel}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </Card>
  );
}