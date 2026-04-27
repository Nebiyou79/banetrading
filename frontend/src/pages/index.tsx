// pages/index.tsx
// ── Marketing landing (pre-login) ──

import Link from 'next/link';
import Head from 'next/head';
import { ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/theme/ThemeToggle';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <title>{BRAND} — Trade crypto, the simple way</title>
      </Head>
      <div className="min-h-screen bg-base text-text-primary">
        {/* ── Nav ── */}
        <header className="border-b border-border bg-elevated/60 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#0B0E11] font-bold">
                P
              </span>
              <span className="text-sm font-semibold tracking-tight">{BRAND}</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-elevated px-3 py-1 text-[11px] uppercase tracking-wider text-text-secondary">
            New · Simplified trading
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
            Trade crypto, <span className="text-accent">the simple way.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-text-secondary leading-relaxed">
            Transparent pricing. Fast execution. Tools that stay out of your way. Open an account in seconds — no clutter, just markets.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" />}>
                Create an account
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg">I already have one</Button>
            </Link>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Feature
              icon={<Zap className="h-5 w-5 text-accent" />}
              title="Fast execution"
              copy="Built for speed — orders route in milliseconds with deep liquidity across pairs."
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5 text-success" />}
              title="Secure by default"
              copy="Cold storage, encrypted sessions, and 6-digit email verification on every new account."
            />
            <Feature
              icon={<BarChart3 className="h-5 w-5 text-info" />}
              title="Clean charts"
              copy="No noise. Just the data you need to trade with confidence."
            />
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border py-10">
          <div className="mx-auto max-w-6xl px-6 text-center text-xs text-text-muted">
            © {new Date().getFullYear()} {BRAND}. Demo project — not financial advice.
          </div>
        </footer>
      </div>
    </>
  );
}

function Feature({ icon, title, copy }: { icon: JSX.Element; title: string; copy: string }): JSX.Element {
  return (
    <div className="rounded-card border border-border bg-elevated p-6 shadow-card">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{copy}</p>
    </div>
  );
}