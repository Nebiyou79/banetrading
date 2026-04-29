// pages/settings/kyc.tsx
// ── Settings → KYC Verification tab ──

import { useState } from 'react';
import Head from 'next/head';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { KycLevelCard } from '@/components/kyc/KycLevelCard';
import { KycLevel2Form } from '@/components/kyc/KycLevel2Form';
import { KycLevel3Form } from '@/components/kyc/KycLevel3Form';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useKyc } from '@/hooks/useKyc';
import { formatDate } from '@/lib/format';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

function idTypeLabel(t?: string): string {
  if (t === 'passport')        return 'Passport';
  if (t === 'national_id')     return 'National ID';
  if (t === 'drivers_license') return "Driver's License";
  return 'ID';
}

function KycSettingsPage(): JSX.Element {
  const { user } = useAuth();
  const { status, isLoading } = useKyc();
  const [level2Open, setLevel2Open] = useState(false);
  const [level3Open, setLevel3Open] = useState(false);

  const tier = user?.kycTier ?? 1;
  const level2 = status?.level2;
  const level3 = status?.level3;

  return (
    <>
      <Head><title>KYC · Settings · {BRAND}</title></Head>
      <AuthenticatedShell>
        <SettingsLayout>
          <div className="flex flex-col gap-6">
            <p className="text-sm text-text-secondary max-w-2xl">
              Higher verification levels unlock larger limits and more features.
            </p>

            {isLoading || !status ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-32 w-full rounded-card" />
                <Skeleton className="h-32 w-full rounded-card" />
                <Skeleton className="h-32 w-full rounded-card" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* ── Level 1 ── always approved (email verification) */}
                <KycLevelCard
                  level={1}
                  title="Email Verification"
                  description="Your email address is the foundation of your account security. You're already verified at this level."
                  status="approved"
                  submittedSummary={user?.email ? <span>Email <span className="font-medium text-text-primary">{user.email}</span></span> : 'Email verified'}
                />

                {/* ── Level 2 ── ID Verification */}
                <KycLevelCard
                  level={2}
                  title="ID Verification"
                  description="Submit a government-issued photo ID to unlock higher deposit, withdrawal, and trading limits."
                  status={level2?.status ?? 'not_submitted'}
                  rejectionReason={level2?.rejectionReason}
                  submittedSummary={
                    level2?.status === 'approved' && level2 ? (
                      <span>
                        {level2.fullName ? <><span className="font-medium text-text-primary">{level2.fullName}</span> · </> : null}
                        {idTypeLabel(level2.idType)}
                        {level2.reviewedAt ? <> · approved {formatDate(level2.reviewedAt)}</> : null}
                      </span>
                    ) : undefined
                  }
                  onStart={() => setLevel2Open(true)}
                />

                {/* ── Level 3 ── Address Verification */}
                <KycLevelCard
                  level={3}
                  title="Address Verification"
                  description="Submit proof of residence (utility bill, bank statement, etc.) to unlock the highest limits."
                  status={level3?.status ?? 'not_submitted'}
                  rejectionReason={level3?.rejectionReason}
                  submittedSummary={
                    level3?.status === 'approved' && level3 ? (
                      <span>
                        {level3.addressLine ? <><span className="font-medium text-text-primary">{level3.addressLine}</span></> : null}
                        {level3.city || level3.country ? <>{level3.addressLine ? ' · ' : null}{[level3.city, level3.country].filter(Boolean).join(', ')}</> : null}
                        {level3.reviewedAt ? <> · approved {formatDate(level3.reviewedAt)}</> : null}
                      </span>
                    ) : undefined
                  }
                  disabled={tier < 2}
                  disabledReason="Complete Level 2 first"
                  onStart={() => setLevel3Open(true)}
                />
              </div>
            )}
          </div>
        </SettingsLayout>
      </AuthenticatedShell>

      <KycLevel2Form open={level2Open} onClose={() => setLevel2Open(false)} />
      <KycLevel3Form open={level3Open} onClose={() => setLevel3Open(false)} />
    </>
  );
}

export default withAuth(KycSettingsPage);