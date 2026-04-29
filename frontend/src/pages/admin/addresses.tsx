// pages/admin/addresses.tsx
// ── Admin: deposit address book + network fee management ──

import Head from 'next/head';
import { Wallet, Receipt } from 'lucide-react';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAdmin } from '@/components/layout/withAdmin';
import { AddressEditor } from '@/components/admin/AddressEditor';
import { NetworkFeeEditor } from '@/components/admin/NetworkFeeEditor';
import { ALL_WITHDRAW_NETWORKS } from '@/types/funds';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

function AdminAddressesPage(): JSX.Element {
  return (
    <>
      <Head><title>Admin · Addresses &amp; Fees · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Admin</span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              Deposit Addresses &amp; Network Fees
            </h1>
            <p className="max-w-2xl text-sm text-text-secondary">
              Manage the addresses users deposit to and the fees charged on withdrawals. Changes apply immediately to all users.
            </p>
          </header>

          {/* ── Deposit addresses ── */}
          <section className="flex flex-col gap-4">
            <SectionHeader
              icon={<Wallet className="h-4 w-4" />}
              title="Deposit addresses"
              copy="Configure the wallet address shown to users for each network. Empty entries are not shown to users."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ALL_WITHDRAW_NETWORKS.map((n) => (
                <AddressEditor key={n} network={n} />
              ))}
            </div>
          </section>

          {/* ── Network fees ── */}
          <section className="flex flex-col gap-4">
            <SectionHeader
              icon={<Receipt className="h-4 w-4" />}
              title="Network fees"
              copy="Set the fee withdrawn from each user's amount. Withdrawals must always be greater than the configured fee."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ALL_WITHDRAW_NETWORKS.map((n) => (
                <NetworkFeeEditor key={n} network={n} />
              ))}
            </div>
          </section>
        </div>
      </AuthenticatedShell>
    </>
  );
}

function SectionHeader({ icon, title, copy }: { icon: JSX.Element; title: string; copy: string }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{title}</span>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="max-w-2xl text-sm text-text-secondary">{copy}</p>
    </div>
  );
}

export default withAdmin(AdminAddressesPage);