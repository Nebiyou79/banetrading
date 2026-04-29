// pages/settings/security.tsx
// ── Settings → Security tab ──

import Head from 'next/head';
import { Mail, Smartphone } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { ChangePasswordCard } from '@/components/settings/ChangePasswordCard';
import { TwoFactorRow } from '@/components/settings/TwoFactorRow';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

function SecuritySettingsPage(): JSX.Element {
  return (
    <>
      <Head><title>Security · Settings · {BRAND}</title></Head>
      <AuthenticatedShell>
        <SettingsLayout>
          <div className="flex flex-col gap-3">
            <ChangePasswordCard />
            <TwoFactorRow
              icon={<Mail className="h-4 w-4" />}
              title="Email 2FA"
              subtitle="Receive a verification code by email when signing in."
            />
            <TwoFactorRow
              icon={<Smartphone className="h-4 w-4" />}
              title="Authenticator App"
              subtitle="Use Google Authenticator or a compatible app to generate codes."
            />
          </div>
        </SettingsLayout>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(SecuritySettingsPage);