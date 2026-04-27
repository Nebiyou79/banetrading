// pages/welcome.tsx
// ── Post-login intro screen ──

import Head from 'next/head';
import { withAuth } from '@/components/layout/withAuth';
import { WelcomeAnimation } from '@/components/landing/WelcomeAnimation';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function WelcomePage(): JSX.Element {
  return (
    <>
      <Head><title>Welcome · {BRAND}</title></Head>
      <WelcomeAnimation />
    </>
  );
}

export default withAuth(WelcomePage);