// pages/convert/index.tsx
// ── Asset Conversion page ──

import Head from 'next/head';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import ConvertForm from '@/components/convert/ConvertForm';
import ConversionHistoryTable from '@/components/convert/ConversionHistoryTable';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function ConvertPage(): JSX.Element {
  return (
    <>
      <Head><title>Convert · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Convert
          </h1>

          <div className="max-w-lg">
            <ConvertForm />
          </div>

          <ConversionHistoryTable />
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(ConvertPage);