// pages/trade.tsx
// ── Trade page — placeholder ──

import Head from 'next/head';
import { CandlestickChart } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

function TradePage(): JSX.Element {
  return (
    <>
      <Head><title>Trade · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              Trade
            </h1>
            <p className="text-sm text-text-muted">Coming in a future update.</p>
          </header>
          <div className="rounded-card border border-border bg-elevated p-10 shadow-card flex flex-col items-center justify-center gap-3 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-text-muted">
              <CandlestickChart className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold text-text-primary">Trading interface coming soon</h2>
            <p className="max-w-md text-sm text-text-secondary">
              Order book, charts, and order placement will live here. Until then, you can still deposit, withdraw, and verify your account.
            </p>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(TradePage);