// pages/index.tsx
// ── BaneTrading — Marketing landing page (Binance/Bybit standard) ──

import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  ArrowRight, ShieldCheck, Zap, BarChart3, TrendingUp,
  TrendingDown, Globe, ChevronRight, Activity, Star,
} from 'lucide-react';
import { ThemeToggle } from '../components/theme/ThemeToggle';
import { useCountUp } from '../hooks/useCountUp';
import { useResponsive } from '../hooks/useResponsive';

const BRAND = 'BaneTrading';

// ── Static ticker data ──
const TICKER_DATA = [
  { sym: 'BTC/USDT',  price: '67,420.50', change: '+2.34', up: true  },
  { sym: 'ETH/USDT',  price: '3,512.80',  change: '+1.82', up: true  },
  { sym: 'SOL/USDT',  price: '142.35',    change: '-0.61', up: false },
  { sym: 'BNB/USDT',  price: '608.90',    change: '+0.94', up: true  },
  { sym: 'XRP/USDT',  price: '0.5340',    change: '-1.23', up: false },
  { sym: 'ADA/USDT',  price: '0.4520',    change: '+3.11', up: true  },
  { sym: 'AVAX/USDT', price: '37.80',     change: '+2.08', up: true  },
  { sym: 'DOT/USDT',  price: '8.940',     change: '-0.44', up: false },
];

// ── Stats ──
const PLATFORM_STATS = [
  { label: '24h Trading Volume', value: 2400000000, prefix: '$', suffix: '',   displayValue: '$2.4B',  sub: 'Across all pairs'   },
  { label: 'Active Traders',     value: 480000,     prefix: '',   suffix: 'K+', displayValue: '480K+',  sub: 'Global users'       },
  { label: 'Listed Assets',      value: 240,        prefix: '',   suffix: '+',  displayValue: '240+',   sub: 'Spot & derivatives' },
  { label: 'Platform Uptime',    value: 99.99,      prefix: '',   suffix: '%',  displayValue: '99.99%', sub: 'Last 12 months'     },
];

// ── Features ──
const FEATURES = [
  {
    icon: <Zap className="h-6 w-6" />,
    tone: 'accent',
    title: 'Instant execution',
    copy: 'Orders route in milliseconds with smart order routing across deep liquidity pools. Never miss a price.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    tone: 'success',
    title: 'Institutional security',
    copy: '95% of assets in cold storage. 2FA, encrypted sessions, and 6-digit email verification on every login.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    tone: 'info',
    title: 'Professional charts',
    copy: 'Advanced TradingView charts with full indicator suite, multiple timeframes, and real-time order book depth.',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    tone: 'warning',
    title: '240+ markets',
    copy: 'Trade spot and derivatives on all major assets. Access global markets from a single unified account.',
  },
  {
    icon: <Activity className="h-6 w-6" />,
    tone: 'accent',
    title: 'Live market data',
    copy: "Real-time price feeds, order book, trade history, and funding rates. Always know exactly what's happening.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    tone: 'success',
    title: 'Regulatory compliance',
    copy: 'Fully KYC-compliant with MiCA-ready infrastructure. Trade confidently within a regulated framework.',
  },
];

const FEATURE_TONE_STYLES: Record<string, { bg: string; color: string; glow: string }> = {
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)',  glow: 'var(--accent-muted)'  },
  success: { bg: 'var(--success-muted)', color: 'var(--success)', glow: 'var(--success-muted)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)',    glow: 'var(--info-muted)'    },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)', glow: 'var(--warning-muted)' },
};

// ── Testimonials ──
const TESTIMONIALS = [
  { quote: "The fastest execution I've seen on a retail platform. Order fills are near-instant.", name: 'A. Müller', role: 'Derivatives trader' },
  { quote: "Clean interface, no noise. Finally a platform that respects the trader's workflow.",  name: 'S. Park',   role: 'Spot trader'        },
  { quote: "The charting suite rivals tools I've used at hedge funds. Seriously impressive.",     name: 'M. Costa',  role: 'Technical analyst'   },
];

// ── Socials ──
const SOCIALS = [
  { label: 'Twitter/X', path: 'M18.3 1.6H21.8L14.7 9.5 23 22.4H16.5L11.4 15.7 5.6 22.4H2.1L9.7 13.9 1.7 1.6H8.4L13 7.7ZM17.1 20.4H19.1L7.7 3.7H5.6Z', viewBox: '0 0 24 24' },
  { label: 'Telegram',  path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 8.04c-.12.56-.44.7-.9.44l-2.5-1.84-1.2 1.16c-.14.13-.25.24-.5.24l.18-2.54 4.6-4.16c.2-.18-.04-.28-.32-.1L7.32 15.8 4.86 15c-.56-.18-.57-.56.12-.82l8.64-3.33c.47-.18.88.12.72.95z', viewBox: '0 0 24 24' },
];

// ── useInView hook ──
function useInView(): [React.RefCallback<HTMLDivElement>, boolean] {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const refCallback = (node: HTMLDivElement | null): void => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(node);
  };

  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, []);

  return [refCallback, visible];
}

// ── Sparkline ──
function Sparkline({ up }: { up: boolean }): JSX.Element {
  const points = up
    ? '0,28 12,24 24,20 36,22 48,16 60,12 72,8 84,10 96,4'
    : '0,6  12,10 24,14 36,12 48,18 60,22 72,20 84,24 96,28';
  return (
    <svg width="48" height="20" viewBox="0 0 96 32" fill="none" className="opacity-80 shrink-0">
      <polyline
        points={points}
        stroke={up ? 'var(--success)' : 'var(--danger)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Marquee ticker ──
function Ticker(): JSX.Element {
  return (
    <div
      className="overflow-hidden border-b border-t border-[var(--border)] py-2.5 group"
      style={{ background: 'var(--surface)' }}
    >
      <div
        className="flex items-center gap-0 whitespace-nowrap group-hover:[animation-play-state:paused]"
        style={{ animation: 'marquee 30s linear infinite' }}
      >
        {[...TICKER_DATA, ...TICKER_DATA].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-6 text-xs shrink-0">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
              style={{
                background: t.up ? 'var(--success-muted)' : 'var(--danger-muted)',
                color: t.up ? 'var(--success)' : 'var(--danger)',
              }}
            >
              {t.sym.slice(0, 1)}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">{t.sym}</span>
            <span className="tabular font-bold text-[var(--text-primary)]">${t.price}</span>
            <span
              className="tabular font-semibold"
              style={{ color: t.up ? 'var(--success)' : 'var(--danger)' }}
            >
              {t.up ? '+' : ''}{t.change}%
            </span>
            <Sparkline up={t.up} />
            <span className="h-3 w-px bg-[var(--border)]" />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stat item with count-up animation ──
function StatItem({ stat, visible }: { stat: typeof PLATFORM_STATS[0]; visible: boolean }): JSX.Element {
  const rawTarget = stat.label === 'Platform Uptime' ? 9999 : stat.value;
  const count = useCountUp(rawTarget, { duration: 1500, decimals: 0 });

  const displayNumber = !visible
    ? stat.displayValue
    : stat.label === '24h Trading Volume'
      ? `${stat.prefix}${(count / 1000000000).toFixed(1)}B`
      : stat.label === 'Active Traders'
        ? `${Math.round(count / 1000)}${stat.suffix}`
        : stat.label === 'Platform Uptime'
          ? `${(count / 100).toFixed(2)}%`
          : `${count}${stat.suffix}`;

  return (
    <div className="flex flex-col gap-1 text-center">
      <span
        className="tabular text-2xl font-extrabold tracking-tight sm:text-3xl"
        style={{ color: 'var(--accent)' }}
      >
        {displayNumber}
      </span>
      <span className="text-xs font-semibold text-[var(--text-primary)]">{stat.label}</span>
      <span className="text-[11px] text-[var(--text-muted)]">{stat.sub}</span>
    </div>
  );
}

function StatsSection(): JSX.Element {
  const [ref, visible] = useInView();
  return (
    <section
      ref={ref}
      className="border-y border-[var(--border)] py-12"
      style={{ background: 'var(--surface)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {PLATFORM_STATS.map((stat) => (
            <StatItem key={stat.label} stat={stat} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid(): JSX.Element {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Why BaneTrading
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            Built for serious traders
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)] leading-relaxed">
            Every feature is designed to get out of your way and let you focus on what matters — the trade.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, idx) => {
            const ts = FEATURE_TONE_STYLES[f.tone];
            return <FeatureCard key={f.title} feature={f} tone={ts} index={idx} />;
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  tone,
  index,
}: {
  feature: typeof FEATURES[0];
  tone: { bg: string; color: string; glow: string };
  index: number;
}): JSX.Element {
  const [ref, visible] = useInView();
  const cardRef = useRef<HTMLDivElement>(null);

  const mergedRef = (node: HTMLDivElement | null): void => {
    ref(node);
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      ref={mergedRef}
      className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] p-6 transition-all duration-500 hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] hover:shadow-[0_4px_24px_var(--accent-muted)]"
      style={{
        background: 'var(--card)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${index * 60}ms`,
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110"
        style={{ background: tone.bg, color: tone.color }}
      >
        {feature.icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{feature.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">{feature.copy}</p>
      </div>
    </div>
  );
}

function TestimonialsSection(): JSX.Element {
  return (
    <section
      className="border-y border-[var(--border)] py-20"
      style={{ background: 'var(--surface)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Traders say
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Trusted by professionals
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] p-6 transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] hover:shadow-[0_4px_24px_var(--accent-muted)]"
              style={{ background: 'var(--card)' }}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5" style={{ color: 'var(--warning)', fill: 'currentColor' }} />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-[var(--text-primary)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="border-t border-[var(--border)] pt-4">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{t.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA(): JSX.Element {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "url(\"data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='48' height='48' patternUnits='userSpaceOnUse'%3E%3Cpath d='M48 0H0V48' fill='none' stroke='%236366F1' stroke-opacity='0.06' stroke-width='0.75'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, var(--accent-muted) 0%, transparent 65%)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Ready to trade with an edge?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--text-secondary)] leading-relaxed">
          Join 480,000+ traders on BaneTrading. Create your free account in under a minute — no credit card required.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold transition-all duration-150 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              animation: 'ctaPulse 2.5s 1s ease-out infinite',
            }}
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-8 py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[0_0_16px_var(--accent-muted)] sm:w-auto"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Mobile nav drawer ──
function MobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element | null {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 z-50 w-72 border-r border-[var(--border)] flex flex-col"
        style={{ background: 'var(--surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-xl overflow-hidden shrink-0">
              <Image src="/assets/logo.jpg" alt={BRAND} fill sizes="32px" className="object-cover" />
            </div>
            <span className="text-sm font-extrabold text-[var(--text-primary)]">{BRAND}</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {['Markets', 'Trade', 'News', 'Learn'].map((item) => (
            <Link
              key={item}
              href={item === 'News' ? '/news' : '#'}
              onClick={onClose}
              className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>
        {/* CTA buttons */}
        <div className="p-4 border-t border-[var(--border)] flex flex-col gap-2">
          <Link
            href="/auth/login"
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth/register"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}

export default function Home(): JSX.Element {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { isMobile } = useResponsive();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDark = mounted ? resolvedTheme !== 'light' : true;

  return (
    <>
      <Head>
        <title>{BRAND} — Institutional-grade crypto trading</title>
        <meta name="description" content="Trade crypto with institutional-grade execution, transparent pricing, and real-time analytics." />
      </Head>

      <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">

        {/* Mobile nav drawer */}
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* ── Sticky nav ── */}
        <header
          className="sticky top-0 z-50 transition-all duration-200"
          style={{
            background: scrolled ? 'var(--surface)' : 'transparent',
            borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          }}
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

            {/* Logo — logo.jpg */}
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 rounded-xl overflow-hidden shrink-0 transition-transform duration-150 group-hover:scale-105">
                <Image
                  src="/assets/logo.jpg"
                  alt={BRAND}
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <span className="block text-sm font-extrabold tracking-tight text-[var(--text-primary)]">
                  {BRAND}
                </span>
                <span className="hidden sm:block text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
                  Pro Trading
                </span>
              </div>
            </Link>

            {/* Nav links — desktop */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]">
              {['Markets', 'Trade', 'News', 'Learn'].map((item) => (
                <Link
                  key={item}
                  href={item === 'News' ? '/news' : '#'}
                  className="relative transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {/* Hamburger — mobile */}
              <button
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1 3h14M1 8h14M1 13h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ── Ticker marquee ── */}
        <Ticker />

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden py-20 sm:py-28 lg:py-36">

          {/* Background: hero.png */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/hero.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover transition-opacity duration-500"
              style={{
                objectPosition: 'center center',
                opacity: isDark ? 0.65 : 0.45,
              }}
            />
            {/* Theme-aware gradient overlay for readability */}
            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? 'linear-gradient(180deg, rgba(9,12,20,0.75) 0%, rgba(9,12,20,0.45) 40%, rgba(9,12,20,0.85) 100%)'
                  : 'linear-gradient(180deg, rgba(243,238,249,0.85) 0%, rgba(243,238,249,0.65) 40%, rgba(243,238,249,0.92) 100%)',
              }}
            />
            {/* Accent color tint overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.18) 0%, transparent 65%)'
                  : 'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.12) 0%, transparent 65%)',
              }}
            />
          </div>

          {/* Accent glow blob — decorative */}
          <div
            className="absolute right-[10%] top-[10%] h-[500px] w-[500px] rounded-full opacity-10 blur-[120px] pointer-events-none z-[1]"
            style={{ background: 'var(--accent)', animation: 'blobFloat 12s ease-in-out infinite' }}
            aria-hidden="true"
          />
          <div
            className="absolute left-[5%] bottom-[10%] h-[300px] w-[300px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none z-[1]"
            style={{ background: 'var(--info)', animation: 'blobFloat 15s 3s ease-in-out infinite reverse' }}
            aria-hidden="true"
          />

          {/* Floating Markets Live badge */}
          <div
            className="absolute top-6 right-6 hidden xl:flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest backdrop-blur-sm z-10"
            style={{
              borderColor: 'var(--success-muted)',
              background: 'rgba(16,217,138,0.08)',
              color: 'var(--success)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            Markets live
          </div>

          {/* Hero content */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">

              {/* Badge */}
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{
                  borderColor: 'var(--accent)',
                  background: 'var(--primary-muted)',
                  color: 'var(--accent)',
                  animation: 'authFadeUp 0.4s 0.1s both',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                Live · 240+ Markets · $2.4B Daily Volume
              </div>

              {/* Headline — theme-aware colors */}
              <h1
                className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
                style={{ color: isDark ? '#E4E9F8' : '#150830' }}
              >
                {['Trade', 'the', 'edge.'].map((word, i) => (
                  <span
                    key={i}
                    className="inline-block"
                    style={{
                      color: i === 1
                        ? (isDark ? 'var(--accent)' : '#7C3AED')
                        : (isDark ? '#E4E9F8' : '#150830'),
                      animation: `wordReveal 0.5s ${0.1 + i * 0.08}s cubic-bezier(0.16,1,0.3,1) both`,
                    }}
                  >
                    {word}&nbsp;
                  </span>
                ))}
                <br />
                <span
                  className="inline-block"
                  style={{
                    color: isDark ? '#A5B4FC' : '#5B3A8C',
                    animation: 'wordReveal 0.5s 0.34s cubic-bezier(0.16,1,0.3,1) both',
                  }}
                >
                  Own the outcome.
                </span>
              </h1>

              <p
                className="mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
                style={{
                  color: isDark ? '#6E7EA8' : '#5B3A8C',
                  animation: 'authFadeUp 0.4s 0.4s both',
                }}
              >
                Institutional-grade execution, transparent pricing, and real-time analytics — built for traders who
                demand precision. Open your account in seconds.
              </p>

              {/* CTA row */}
              <div
                className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                style={{ animation: 'authFadeUp 0.4s 0.5s both' }}
              >
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold transition-all duration-150 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--text-inverse)',
                    animation: 'ctaPulse 2.5s 1s ease-out infinite',
                  }}
                >
                  Start trading free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-transparent px-8 py-3.5 text-sm font-semibold text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[0_0_16px_var(--accent-muted)] sm:w-auto"
                >
                  Log in to my account
                </Link>
              </div>

              {/* Trust line */}
              <p
                className="mt-5 text-[11px] text-[var(--text-muted)]"
                style={{ animation: 'authFadeUp 0.4s 0.55s both' }}
              >
                No credit card required · Free account · Cancel anytime
              </p>
            </div>

            {/* ── Mini market table ── */}
            <div
              className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border border-[var(--border)]"
              style={{
                background: isDark ? 'rgba(22,29,53,0.85)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                animation: 'authFadeUp 0.4s 0.65s both',
              }}
            >
              {/* Table header */}
              <div className="grid grid-cols-4 border-b border-[var(--border)] px-4 py-2.5">
                {['Market', 'Price', '24h Change', 'Chart'].map((h) => (
                  <span
                    key={h}
                    className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]"
                  >
                    {h}
                  </span>
                ))}
              </div>
              {/* Rows */}
              {TICKER_DATA.slice(0, 5).map((t) => (
                <div
                  key={t.sym}
                  className="grid grid-cols-4 items-center border-b border-[var(--border)] px-4 py-3 transition-colors duration-100 hover:bg-[var(--hover-bg)] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: t.up ? 'var(--success-muted)' : 'var(--danger-muted)',
                        color: t.up ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {t.sym.slice(0, 1)}
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {t.sym.split('/')[0]}
                    </span>
                  </div>
                  <span className="tabular text-sm font-bold text-[var(--text-primary)]">
                    ${t.price}
                  </span>
                  <span
                    className="tabular text-sm font-semibold"
                    style={{ color: t.up ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {t.up
                      ? <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
                      : <TrendingDown className="mr-1 inline h-3.5 w-3.5" />}
                    {t.up ? '+' : ''}{t.change}%
                  </span>
                  <Sparkline up={t.up} />
                </div>
              ))}
              {/* View all */}
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--hover-bg)]"
                style={{ color: 'var(--accent)' }}
              >
                View all 240+ markets
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Platform stats ── */}
        <StatsSection />

        {/* ── Features grid ── */}
        <FeaturesGrid />

        {/* ── Testimonials ── */}
        <TestimonialsSection />

        {/* ── Final CTA ── */}
        <FinalCTA />

        {/* ── Footer ── */}
        <footer
          className="border-t border-[var(--border)] py-10"
          style={{ background: 'var(--surface)' }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row flex-wrap">

              {/* Brand — logo.jpg */}
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src="/assets/logo.jpg"
                    alt={BRAND}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-[var(--text-primary)]">{BRAND}</div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">
                    Pro Trading Platform
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] text-[var(--text-muted)]">
                {['Terms', 'Privacy', 'Cookies', 'Support', 'Status'].map((l) => (
                  <Link
                    key={l}
                    href="#"
                    className="transition-colors duration-150 hover:text-[var(--text-secondary)]"
                  >
                    {l}
                  </Link>
                ))}
              </div>

              {/* Social */}
              <div className="flex items-center gap-4">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--accent)]"
                  >
                    <svg width="18" height="18" viewBox={s.viewBox} fill="currentColor">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>

              {/* Copyright */}
              <p className="text-[11px] text-[var(--text-muted)]">
                © {new Date().getFullYear()} {BRAND} · Not financial advice
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes wordReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ctaPulse {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.45); }
          70%  { box-shadow: 0 0 0 14px rgba(99,102,241,0);  }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0);     }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%       { transform: translate(20px,-20px) scale(1.05); }
          66%       { transform: translate(-15px,15px) scale(0.95); }
        }
      `}</style>
    </>
  );
}