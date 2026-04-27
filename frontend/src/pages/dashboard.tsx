// pages/dashboard.tsx
// ── Authenticated dashboard ──

import Head from 'next/head';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { PortfolioCard } from '@/components/dashboard/PortfolioCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { BalanceBreakdown } from '@/components/dashboard/BalanceBreakdown';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { AssetsList } from '@/components/dashboard/AssetsList';
import { KycBanner } from '@/components/dashboard/KycBanner';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  const { portfolio, isLoading: isPortfolioLoading } = usePortfolio();
  const { transactions, isLoading: isTxLoading } = useRecentTransactions(8);

  return (
    <>
      <Head><title>Dashboard · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          {user && user.kycStatus !== 'approved' && (
            <KycBanner status={user.kycStatus} tier={user.kycTier} />
          )}

          <GreetingHeader />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioCard portfolio={portfolio} isLoading={isPortfolioLoading} />
            </div>
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>

          <BalanceBreakdown portfolio={portfolio} isLoading={isPortfolioLoading} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RecentTransactions transactions={transactions} isLoading={isTxLoading} limit={8} />
            <AssetsList portfolio={portfolio} isLoading={isPortfolioLoading} />
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(DashboardPage);