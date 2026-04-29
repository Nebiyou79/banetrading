// pages/balance.tsx
// ── Balance / funds hub ──

import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { BalanceHero } from '@/components/funds/BalanceHero';
import { TransactionHistoryTable } from '@/components/funds/TransactionHistoryTable';
import { DepositModal } from '@/components/funds/DepositModal';
import { WithdrawModal } from '@/components/funds/WithdrawModal';
import { useDeposit } from '@/hooks/useDeposit';
import { useWithdraw } from '@/hooks/useWithdraw';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';
const PAGE_SIZE = 20;

function BalancePage(): JSX.Element {
  const router = useRouter();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const {
    deposits,
    total: totalDeposits,
    isLoading: isDepositsLoading,
  } = useDeposit(limit, 0);

  const {
    withdrawals,
    total: totalWithdrawals,
    isLoading: isWithdrawalsLoading,
  } = useWithdraw(limit, 0);

  const isLoading = isDepositsLoading || isWithdrawalsLoading;
  const hasMore = useMemo(
    () => deposits.length + withdrawals.length < totalDeposits + totalWithdrawals,
    [deposits.length, withdrawals.length, totalDeposits, totalWithdrawals],
  );
  const [isLoadingMore, setLoadingMore] = useState(false);

  // ── Sync ?action=deposit|withdraw query (from QuickActions on dashboard) ──
  useEffect(() => {
    if (!router.isReady) return;
    const action = router.query.action;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (action === 'deposit')  setDepositOpen(true);
    if (action === 'withdraw') setWithdrawOpen(true);
    if (action === 'deposit' || action === 'withdraw') {
      const { action: _drop, ...rest } = router.query;
      router.replace({ pathname: '/balance', query: rest }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query, router]);

  const handleLoadMore = async (): Promise<void> => {
    setLoadingMore(true);
    setLimit((x) => x + PAGE_SIZE);
    // Allow query refetch to settle
    setTimeout(() => setLoadingMore(false), 400);
  };

  return (
    <>
      <Head><title>Balance · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <BalanceHero
            onDeposit={() => setDepositOpen(true)}
            onWithdraw={() => setWithdrawOpen(true)}
          />
          <TransactionHistoryTable
            deposits={deposits}
            withdrawals={withdrawals}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
          />
        </div>
      </AuthenticatedShell>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </>
  );
}

export default withAuth(BalancePage);