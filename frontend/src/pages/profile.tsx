// pages/profile.tsx
// ── BaneTrading — Profile page with tabs (Binance/Bybit standard) ──

import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  User as UserIcon, ShieldCheck, BadgeCheck,
  ChevronRight, AlertCircle,
} from 'lucide-react';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { SecurityCard } from '@/components/profile/SecurityCard';
import { KycStatusCard } from '@/components/profile/KycStatusCard';
import { useProfile } from '@/hooks/useProfile';
import { useResponsive } from '@/hooks/useResponsive';

const BRAND = 'BaneTrading';

// ── Tab config ──
interface TabDef {
  id: string;
  label: string;
  icon: JSX.Element;
  mobileLabel: string;
  badge?: string;
}

// ── Shared section card wrapper ──
function SectionCard({
  children,
  noPad,
}: {
  children: React.ReactNode;
  noPad?: boolean;
}): JSX.Element {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--border)] ${noPad ? '' : 'p-5 sm:p-6'}`}
      style={{ background: 'var(--bg-muted)' }}
    >
      {children}
    </div>
  );
}

// ── Section skeleton (reusable) ──
function SectionSkeleton({ rows = 3 }: { rows?: number }): JSX.Element {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded bg-[var(--bg-card-hover)]" />
          <div
            className="h-10 rounded-lg bg-[var(--bg-card-hover)]"
            style={{ width: i % 2 === 0 ? '100%' : '75%' }}
          />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <div className="h-9 w-24 rounded-lg bg-[var(--bg-card-hover)]" />
        <div className="h-9 w-28 rounded-lg bg-[var(--bg-card-hover)]" />
      </div>
    </div>
  );
}

// ── Section divider with label ──
function SectionDivider({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[var(--border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

// ── Desktop horizontal tab bar ──
function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}): JSX.Element {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--border)]"
      style={{ background: 'var(--bg-muted)' }}
    >
      <div className="flex items-center gap-0 border-b border-[var(--border)]" style={{ background: 'var(--bg-elevated)' }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-150"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'transparent' : 'transparent',
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <span
                className="transition-colors duration-150"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
                  style={{ background: 'var(--danger)', color: 'var(--text-inverse)' }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-5 sm:p-6 animate-fade-in">
        {/* Content rendered by parent */}
      </div>
    </div>
  );
}

// ── Mobile accordion section ──
function MobileSection({
  tab,
  isOpen,
  onToggle,
  children,
}: {
  tab: TabDef;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <SectionCard noPad>
      {/* Header toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 transition-colors duration-150 hover:bg-[var(--hover-bg)]"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: isOpen ? 'var(--accent-muted)' : 'var(--bg-elevated)',
              color:      isOpen ? 'var(--accent)'        : 'var(--text-muted)',
            }}
          >
            {tab.icon}
          </span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{tab.label}</span>
          {tab.badge && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
              style={{ background: 'var(--danger)', color: 'var(--text-inverse)' }}
            >
              {tab.badge}
            </span>
          )}
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="border-t border-[var(--border)] px-4 pb-5 pt-4 animate-fade-in">
          {children}
        </div>
      )}
    </SectionCard>
  );
}

// ── Personal tab content ──
function PersonalTabContent({
  profile,
  isLoading,
}: {
  profile: ReturnType<typeof useProfile>['profile'];
  isLoading: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      {/* Avatar uploader */}
      <div>
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Profile photo
        </p>
        <AvatarUploader />
      </div>

      <SectionDivider label="Personal information" />

      {/* Personal info form */}
      {isLoading || !profile
        ? <SectionSkeleton rows={4} />
        : <PersonalInfoForm />
      }
    </div>
  );
}

// ── KYC tab content ──
function KycTabContent({
  profile,
  isLoading,
}: {
  profile: ReturnType<typeof useProfile>['profile'];
  isLoading: boolean;
}): JSX.Element {
  if (isLoading || !profile) {
    return <SectionSkeleton rows={3} />;
  }

  // Rejected callout
  const showRejectedCallout = profile.kycStatus === 'rejected';

  return (
    <div className="flex flex-col gap-5">
      {showRejectedCallout && (
        <div
          className="flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: 'var(--danger)', background: 'var(--danger-muted)' }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--danger)' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
              Action required
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--danger)' }}>
              Your KYC submission was rejected. Please review the feedback and resubmit your documents.
            </p>
          </div>
        </div>
      )}
      <KycStatusCard user={profile} />
    </div>
  );
}

// ── Main page ──
const VALID_TABS = new Set(['personal', 'security', 'kyc']);

function ProfilePage(): JSX.Element {
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const { isMobile } = useResponsive();

  const [activeTab, setActiveTab] = useState('personal');
  const [openMobileSection, setOpenMobileSection] = useState<string>('personal');

  // Build tabs — add "action needed" badge if KYC rejected
  const TABS: TabDef[] = [
    {
      id: 'personal',
      label: 'Personal info',
      mobileLabel: 'Personal',
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      id: 'security',
      label: 'Security',
      mobileLabel: 'Security',
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      id: 'kyc',
      label: 'KYC status',
      mobileLabel: 'KYC',
      icon: <BadgeCheck className="h-4 w-4" />,
      badge: profile?.kycStatus === 'rejected' ? '!' : undefined,
    },
  ];

  // Sync ?tab= query param
  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.tab;
    const next = typeof raw === 'string' && VALID_TABS.has(raw) ? raw : 'personal';
    if (next !== activeTab) {
      setActiveTab(next);
      setOpenMobileSection(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.tab]);

  const handleTabChange = (next: string): void => {
    setActiveTab(next);
    router.replace(
      { pathname: '/profile', query: { ...router.query, tab: next } },
      undefined,
      { shallow: true },
    );
  };

  const handleMobileToggle = (id: string): void => {
    setOpenMobileSection((prev) => (prev === id ? '' : id));
  };

  // ── Tab content renderer ──
  const renderTabContent = (id: string): JSX.Element => {
    switch (id) {
      case 'personal':
        return <PersonalTabContent profile={profile} isLoading={isLoading} />;
      case 'security':
        return <SecurityCard />;
      case 'kyc':
        return <KycTabContent profile={profile} isLoading={isLoading} />;
      default:
        return <></>;
    }
  };

  return (
    <>
      <Head>
        <title>Profile · {BRAND}</title>
        <meta name="description" content="Manage your BaneTrading profile, security, and KYC verification." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-5">

          {/* ── Page header ── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Account
            </p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Profile settings
            </h1>
          </div>

          {/* ── Profile header card ── */}
          <ProfileHeader user={profile!} />

          {/* ── Desktop tab layout ── */}
          {!isMobile && (
            <div
              className="overflow-hidden rounded-2xl border border-[var(--border)]"
              style={{ background: 'var(--bg-muted)' }}
            >
              {/* Tab bar */}
              <div
                className="flex items-stretch border-b border-[var(--border)]"
                style={{ background: 'var(--bg-elevated)' }}
                role="tablist"
                aria-label="Profile sections"
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.id}`}
                      onClick={() => handleTabChange(tab.id)}
                      className="relative flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all duration-150"
                      style={{
                        color:      isActive ? 'var(--text-primary)'   : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                      }}
                    >
                      {/* Bottom accent bar */}
                      {isActive && (
                        <span
                          className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-full"
                          style={{ background: 'var(--accent)' }}
                        />
                      )}
                      <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {tab.icon}
                      </span>
                      {tab.label}
                      {tab.badge && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
                          style={{ background: 'var(--danger)', color: 'var(--text-inverse)' }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab panel */}
              <div
                id={`panel-${activeTab}`}
                role="tabpanel"
                className="p-5 sm:p-6 animate-fade-in"
                key={activeTab}
              >
                {renderTabContent(activeTab)}
              </div>
            </div>
          )}

          {/* ── Mobile accordion layout ── */}
          {isMobile && (
            <div className="flex flex-col gap-3">
              {TABS.map((tab) => (
                <MobileSection
                  key={tab.id}
                  tab={tab}
                  isOpen={openMobileSection === tab.id}
                  onToggle={() => handleMobileToggle(tab.id)}
                >
                  {renderTabContent(tab.id)}
                </MobileSection>
              ))}
            </div>
          )}
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(ProfilePage);