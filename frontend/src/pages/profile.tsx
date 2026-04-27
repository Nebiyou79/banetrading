// pages/profile.tsx
// ── Profile page with Personal / Security / KYC tabs ──

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { User as UserIcon, ShieldCheck, BadgeCheck } from 'lucide-react';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { Card } from '@/components/ui/Card';
import { Tabs, TabItem } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { SecurityCard } from '@/components/profile/SecurityCard';
import { KycStatusCard } from '@/components/profile/KycStatusCard';
import { useProfile } from '@/hooks/useProfile';
import { useResponsive } from '@/hooks/useResponsive';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

const TAB_ITEMS: TabItem[] = [
  { id: 'personal', label: 'Personal info', icon: <UserIcon className="h-4 w-4" /> },
  { id: 'security', label: 'Security',      icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 'kyc',      label: 'KYC status',    icon: <BadgeCheck className="h-4 w-4" /> },
];

const VALID_TABS = new Set(['personal', 'security', 'kyc']);

function ProfilePage(): JSX.Element {
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const { isMobile } = useResponsive();
  const [tab, setTab] = useState<string>('personal');

  // ── Sync ?tab= query param ──
  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.tab;
    const next = typeof raw === 'string' && VALID_TABS.has(raw) ? raw : 'personal';
    if (next !== tab) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.tab]);

  const handleTabChange = (next: string): void => {
    setTab(next);
    router.replace(
      { pathname: '/profile', query: { ...router.query, tab: next } },
      undefined,
      { shallow: true },
    );
  };

  return (
    <>
      <Head><title>Profile · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <Card>
            {isLoading || !profile ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ) : (
              <ProfileHeader user={profile} />
            )}
          </Card>

          {isMobile ? (
            <MobileStacked profile={profile} isLoading={isLoading} />
          ) : (
            <Tabs items={TAB_ITEMS} value={tab} onChange={handleTabChange} ariaLabel="Profile sections">
              {(activeId) => (
                <Card>
                  {activeId === 'personal' && <PersonalSection profile={profile} isLoading={isLoading} />}
                  {activeId === 'security' && <SecurityCard />}
                  {activeId === 'kyc' && profile && <KycStatusCard user={profile} />}
                  {activeId === 'kyc' && !profile && <SectionSkeleton />}
                </Card>
              )}
            </Tabs>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

function PersonalSection({ profile, isLoading }: { profile: ReturnType<typeof useProfile>['profile']; isLoading: boolean }): JSX.Element {
  return (
    <div className="flex flex-col gap-8">
      <AvatarUploader />
      {isLoading || !profile ? <SectionSkeleton /> : <PersonalInfoForm />}
    </div>
  );
}

function MobileStacked({ profile, isLoading }: { profile: ReturnType<typeof useProfile>['profile']; isLoading: boolean }): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <Card header={<SectionTitle icon={<UserIcon className="h-4 w-4" />} title="Personal info" />}>
        <PersonalSection profile={profile} isLoading={isLoading} />
      </Card>
      <Card header={<SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Security" />}>
        <SecurityCard />
      </Card>
      <Card header={<SectionTitle icon={<BadgeCheck className="h-4 w-4" />} title="KYC status" />}>
        {profile ? <KycStatusCard user={profile} /> : <SectionSkeleton />}
      </Card>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: JSX.Element; title: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
      <span className="text-text-muted">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

function SectionSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

export default withAuth(ProfilePage);