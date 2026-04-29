// pages/admin/index.tsx
// ── Admin landing — entry point for admin tools ──

import Head from 'next/head';
import Link from 'next/link';
import { Wallet, ArrowRight, Shield } from 'lucide-react';

import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAdmin } from '@/components/layout/withAdmin';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

interface AdminCard {
  href: string;
  title: string;
  copy: string;
  icon: JSX.Element;
  ready: boolean;
}

const CARDS: AdminCard[] = [
  {
    href: '/admin/addresses',
    title: 'Addresses & Fees',
    copy: 'Configure deposit addresses per network and set per-network withdrawal fees.',
    icon: <Wallet className="h-5 w-5" />,
    ready: true,
  },
  // TODO: Future admin modules — pending deposits review UI, user management, etc.
];

function AdminHomePage(): JSX.Element {
  return (
    <>
      <Head><title>Admin · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-8">
          <header className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Admin</span>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">Platform tools</h1>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CARDS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex flex-col gap-3 rounded-card border border-border bg-elevated p-5 shadow-card transition-colors hover:border-accent/40"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-text-secondary group-hover:text-accent transition-colors">
                  {c.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{c.title}</div>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">{c.copy}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAdmin(AdminHomePage);