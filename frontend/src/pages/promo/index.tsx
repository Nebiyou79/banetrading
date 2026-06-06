// pages/promo.tsx
// ── Capital Coin Trade — Promo / Referral Hub ──
//
// PROMO FEATURES:
// 1. Hero section with promo code display, copy, and share functionality
// 2. Stats grid showing signups, depositors, and bonus progress
// 3. Milestone trackers with confetti celebration on unlock
// 4. Leaderboard showing top referrers
// 5. Recent referrals list with deposit status
// 6. Share sheet modal for social sharing

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Gift, Share2, TrendingUp, Users, RefreshCw } from 'lucide-react';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { usePromoMe } from '@/hooks/usePromoMe';
import { usePromoLeaderboard } from '@/hooks/usePromoLeaderboard';
import { useMyReferrals } from '@/hooks/useMyReferrals';
import { useResponsive } from '@/hooks/useResponsive';
import { promoService } from '@/services/promoService';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const PromoHero = dynamic(() => import('@/components/promo/PromoHero'), {
  loading: () => <PromoHeroSkeleton />,
  ssr: false,
});

// pages/promo.tsx - Fix the dynamic import syntax

const PromoStatsGrid = dynamic(() => import('@/components/promo/PromoStatsGrid'), {
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-[var(--bg-muted)] rounded-xl animate-pulse" />
      ))}
    </div>
  ),
  ssr: false,
});

const PromoMilestoneTracker = dynamic(() => import('@/components/promo/PromoMilestoneTracker'), {
  loading: () => <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-[var(--bg-muted)] rounded-xl animate-pulse" />)}</div>,
  ssr: false,
});

const PromoLeaderboard = dynamic(() => import('@/components/promo/PromoLeaderboard'), {
  loading: () => <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[var(--bg-muted)] rounded-lg animate-pulse" />)}</div>,
  ssr: false,
});

const PromoReferralsList = dynamic(() => import('@/components/promo/PromoReferralsList'), {
  loading: () => <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-[var(--bg-muted)] rounded-lg animate-pulse" />)}</div>,
  ssr: false,
});

const ShareSheetModal = dynamic(() => import('@/components/promo/ShareSheetModal'), {
  ssr: false,
});

// Skeleton components
function PromoHeroSkeleton(): JSX.Element {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8 animate-pulse">
      <div className="h-4 w-32 bg-[var(--bg-muted)] rounded mb-4" />
      <div className="h-14 w-64 bg-[var(--bg-muted)] rounded-xl mb-3" />
      <div className="h-5 w-40 bg-[var(--bg-muted)] rounded" />
    </div>
  );
}

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'Capital Coin Trade';

// ── Quick action button ──
interface QuickBtnProps {
  icon: JSX.Element;
  label: string;
  tone: 'accent' | 'neutral';
  onClick: () => void;
  disabled?: boolean;
}

function QuickBtn({ icon, label, tone, onClick, disabled }: QuickBtnProps): JSX.Element {
  const bgMap = {
    accent: 'var(--accent)',
    neutral: 'var(--bg-elevated)',
  };
  const colorMap = {
    accent: 'var(--text-inverse)',
    neutral: 'var(--text-secondary)',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                 transition-all duration-150 hover:opacity-90
                 disabled:cursor-not-allowed disabled:opacity-40
                 border border-[var(--border)]"
      style={{
        background: bgMap[tone],
        color: colorMap[tone],
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main Page ──
function PromoPage(): JSX.Element {
  const { isMobile } = useResponsive();
  const [shareOpen, setShareOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = usePromoMe();

  const {
    leaderboard,
    isLoading: leaderboardLoading,
    refetch: refetchLeaderboard,
  } = usePromoLeaderboard();

  const {
    referrals,
    isLoading: referralsLoading,
    refetch: refetchReferrals,
  } = useMyReferrals(20);

  const isLoading = statsLoading || leaderboardLoading || referralsLoading;

  const handleGenerateCode = async (): Promise<void> => {
    try {
      const { code } = await promoService.generateCode();
      await refetchStats();
      toast.success(`Promo code "${code}" generated!`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to generate code');
    }
  };

  const handleRefresh = async (): Promise<void> => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchLeaderboard(), refetchReferrals()]);
    toast.success('Referral data refreshed');
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleShare = (): void => {
    if (stats?.code) {
      setShareOpen(true);
    }
  };

  return (
    <>
      <Head>
        <title>Promo & Referrals · {BRAND}</title>
        <meta
          name="description"
          content="Invite friends, earn bonuses, and climb the leaderboard. Share your unique promo code and get rewarded when they sign up and deposit."
        />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {/* ── Page header ── */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Referral Program
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                Promo &amp; Referrals
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Invite friends, earn bonuses, and climb the leaderboard
              </p>
            </div>

            <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] transition-colors duration-150 hover:border-[var(--border-strong)] disabled:opacity-50"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {stats?.code && (
                <QuickBtn
                  icon={<Share2 className="h-4 w-4" />}
                  label="Share"
                  tone="accent"
                  onClick={handleShare}
                />
              )}
            </div>
          </div>

          {/* ── Hero Section ── */}
          <PromoHero
            stats={stats}
            isLoading={statsLoading}
            onGenerate={handleGenerateCode}
            onShare={handleShare}
          />

          {/* ── Stats Grid ── */}
          {stats?.hasCode && (
            <>
              <PromoStatsGrid stats={stats} isLoading={statsLoading} />

              {/* ── Milestone Trackers ── */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[var(--accent)]" />
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Milestone Rewards</h2>
                </div>
                <PromoMilestoneTracker stats={stats} isLoading={statsLoading} />
              </section>
            </>
          )}

          {/* ── Two-column layout for leaderboard & referrals ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Leaderboard */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Leaderboard</h2>
              </div>
              <PromoLeaderboard />
            </section>

            {/* Recent Referrals */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Referrals</h2>
              </div>
              <PromoReferralsList />
            </section>
          </div>

          {/* ── How it works ── */}
          {!stats?.hasCode && !statsLoading && (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">How it works</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {[
                  { step: 1, title: 'Generate your code', desc: 'Create your unique referral code in one click.' },
                  { step: 2, title: 'Share with friends', desc: 'Send your code via WhatsApp, Twitter, or Telegram.' },
                  { step: 3, title: 'Earn bonuses', desc: 'Get rewards when friends sign up and make their first deposit.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Terms note ── */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
            <p className="text-[11px] text-[var(--text-muted)]">
              * Bonuses are credited automatically when milestones are reached. Each user can only be referred once.
              Promo codes are non-transferable and subject to our{' '}
              <button
                type="button"
                className="underline transition-colors hover:text-[var(--accent)]"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => window.open('/terms', '_blank')}
              >
                Terms & Conditions
              </button>
              .
            </p>
          </div>
        </div>
      </AuthenticatedShell>

      {/* Share Modal */}
      {stats?.code && (
        <ShareSheetModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          code={stats.code}
        />
      )}
    </>
  );
}

export default withAuth(PromoPage);