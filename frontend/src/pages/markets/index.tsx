// pages/markets/index.tsx
// ── MARKETS HUB — REDIRECTS TO CRYPTO ──

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

const MarketsIndexPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/markets/crypto');
  }, [router]);

  return (
    <AuthenticatedShell>
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
      <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
    </div>
    </AuthenticatedShell>

  );
};

export default MarketsIndexPage;