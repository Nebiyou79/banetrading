// pages/welcome.tsx
// ── BaneTrading — Post-login animated welcome screen ──

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowRight, BarChart3, ShieldCheck, BadgeCheck,
  TrendingUp, CheckCircle2, Zap,
} from 'lucide-react';
import { withAuth } from '@/components/layout/withAuth';
import { useProfile } from '@/hooks/useProfile';
import { useResponsive } from '@/hooks/useResponsive';
import { WelcomeAnimation } from '@/components/landing/WelcomeAnimation';
import { WelcomeStats } from '@/components/landing/WelcomeStats';

const BRAND = 'BaneTrading';
const AUTO_REDIRECT_SECONDS = 8;

// ── Quick-action cards ──
const QUICK_ACTIONS = [
  {
    id: 'trade',
    icon: <BarChart3 className="h-6 w-6" />,
    tone: 'accent',
    title: 'Start trading',
    desc: 'Access 240+ spot and derivatives markets with real-time charts.',
    href: '/trade',
    cta: 'Open charts',
  },
  {
    id: 'kyc',
    icon: <BadgeCheck className="h-6 w-6" />,
    tone: 'success',
    title: 'Verify identity',
    desc: 'Complete KYC to unlock full limits and all platform features.',
    href: '/kyc',
    cta: 'Start KYC',
  },
  {
    id: 'security',
    icon: <ShieldCheck className="h-6 w-6" />,
    tone: 'info',
    title: 'Secure your account',
    desc: 'Enable 2FA and review your security settings.',
    href: '/profile?tab=security',
    cta: 'Go to security',
  },
];

const TONE_STYLES: Record<string, { bg: string; color: string }> = {
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)'  },
  success: { bg: 'var(--success-muted)', color: 'var(--success)' },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)'    },
  warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
};

// ── Live market prices strip ──
const TICKERS = [
  { sym: 'BTC', price: '67,420', change: '+2.34', up: true  },
  { sym: 'ETH', price: '3,512',  change: '+1.82', up: true  },
  { sym: 'SOL', price: '142.3',  change: '-0.61', up: false },
  { sym: 'BNB', price: '608.9',  change: '+0.94', up: true  },
];

// ── Animated check mark ──
function AnimatedCheck(): JSX.Element {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring */}
      <div
        className="absolute h-24 w-24 rounded-full opacity-20 animate-ping"
        style={{ background: 'var(--accent)', animationDuration: '2s' }}
      />
      {/* Rotating ring */}
      <div
        className="absolute h-28 w-28 rounded-full border-2 border-dashed opacity-20"
        style={{
          borderColor: 'var(--accent)',
          animation: 'spin 8s linear infinite',
        }}
        aria-hidden="true"
      />
      {/* Mid ring */}
      <div
        className="absolute h-16 w-16 rounded-full opacity-30"
        style={{ background: 'var(--accent-muted)' }}
      />
      {/* Check icon */}
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--info) 100%)',
          boxShadow: '0 0 40px var(--accent-muted)',
          animation: 'successBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--text-inverse)' }} />
      </div>
    </div>
  );
}

// ── Countdown ring ──
function CountdownRing({ seconds, total }: { seconds: number; total: number }): JSX.Element {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const progress = ((total - seconds) / total) * circ;

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90" aria-hidden="true">
      {/* Track */}
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke="var(--border-strong)"
        strokeWidth="3"
      />
      {/* Fill */}
      <circle
        cx="22" cy="22" r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={circ - progress}
        strokeLinecap="round"
        className="transition-all duration-1000"
        style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }}
      />
    </svg>
  );
}

function WelcomePage(): JSX.Element {
  const router = useRouter();
  const { profile } = useProfile();
  const { isMobile } = useResponsive();
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [stage, setStage] = useState<'intro' | 'visible'>('intro');

  const displayName = profile?.displayName || profile?.name || 'Trader';

  // Show WelcomeAnimation for 1.5s then reveal main welcome content
  useEffect(() => {
    const t = setTimeout(() => {
      setStage('visible');
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  // Countdown + auto-redirect
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/trade');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  // Show the WelcomeAnimation component first
  if (stage === 'intro') {
    return <WelcomeAnimation />;
  }

  return (
    <>
      <Head>
        <title>Welcome · {BRAND}</title>
        <meta name="description" content="Welcome to BaneTrading — your account is ready." />
      </Head>

      <div
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12"
        style={{ background: 'var(--background)' }}
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[10%] left-[10%] h-72 w-72 rounded-full blur-[100px] opacity-10"
            style={{ background: 'var(--accent)', animation: 'blobFloat 12s ease-in-out infinite' }}
          />
          <div
            className="absolute bottom-[15%] right-[10%] h-56 w-56 rounded-full blur-[80px] opacity-8"
            style={{ background: 'var(--info)', animation: 'blobFloat 15s 3s ease-in-out infinite reverse' }}
          />
          <div
            className="absolute top-[50%] left-[50%] h-40 w-40 rounded-full blur-[60px] opacity-6"
            style={{ background: 'var(--success)', animation: 'blobFloat 10s 6s ease-in-out infinite' }}
          />
        </div>

        <div
          className="relative z-10 mx-auto w-full max-w-2xl transition-all duration-500"
          style={{
            opacity:    stage === 'visible' ? 1 : 0,
            transform:  stage === 'visible' ? 'translateY(0)' : 'translateY(16px)',
          }}
        >
          {/* ── Hero card ── */}
          <div
            className="overflow-hidden rounded-3xl border border-[var(--border)] text-center"
            style={{
              background:  'var(--bg-elevated)',
              boxShadow:   '0 8px 64px var(--accent-muted), 0 0 0 1px var(--border)',
            }}
          >
            {/* Accent top bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, var(--accent) 0%, var(--info) 50%, var(--success) 100%)' }}
            />

            <div className="px-6 py-10 sm:px-10 sm:py-12">
              {/* Animated check */}
              <div style={{ animation: 'authFadeUp 0.4s 0.1s both' }}>
                <AnimatedCheck />
              </div>

              {/* Welcome text */}
              <div className="mt-8" style={{ animation: 'authFadeUp 0.4s 0.2s both' }}>
                <div
                  className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ borderColor: 'var(--accent-muted)', background: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  <Zap className="h-3 w-3" />
                  Account ready
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  Welcome to {BRAND},{' '}
                  <span style={{ color: 'var(--accent)' }}>{displayName}.</span>
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                  Your account is set up and ready. Start with the steps below to get the most out of the platform.
                </p>
              </div>

              {/* ── Welcome Stats pills ── */}
              <div className="mt-6" style={{ animation: 'authFadeUp 0.4s 0.35s both' }}>
                <WelcomeStats />
              </div>

              {/* ── Live ticker strip — scrolling marquee ── */}
              <div
                className="overflow-hidden rounded-xl border border-[var(--border)] mx-auto mt-8"
                style={{ background: 'var(--bg-muted)', animation: 'authFadeUp 0.4s 0.45s both' }}
              >
                <div
                  className="flex items-center gap-6 whitespace-nowrap py-3 px-4"
                  style={{ animation: 'marquee 20s linear infinite' }}
                >
                  {[...TICKERS, ...TICKERS].map((t, i) => (
                    <div key={i} className="inline-flex items-center gap-3 text-xs shrink-0">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          background: t.up ? 'var(--success-muted)' : 'var(--danger-muted)',
                          color: t.up ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {t.sym.slice(0, 1)}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {t.sym}
                      </span>
                      <span className="tabular font-bold text-[var(--text-primary)]">${t.price}</span>
                      <span className={`tabular font-semibold ${t.up ? 'text-gain' : 'text-loss'}`}>
                        {t.up ? '+' : ''}{t.change}%
                      </span>
                      <span className="h-3 w-px bg-[var(--border)]" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CTA buttons ── */}
              <div
                className={`mt-8 flex gap-3 ${isMobile ? 'flex-col' : 'items-center justify-center'}`}
                style={{ animation: 'authFadeUp 0.4s 0.55s both' }}
              >
                <Link
                  href="/trade"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-150 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'var(--accent)',
                    color:      'var(--text-inverse)',
                    boxShadow:  '0 0 24px var(--accent-muted)',
                  }}
                >
                  <TrendingUp className="h-4 w-4" />
                  Start trading now
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-6 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[0_0_16px_var(--accent-muted)]"
                >
                  Complete profile
                </Link>
              </div>

              {/* ── Auto-redirect row ── */}
              <div
                className="mt-6 flex items-center justify-center gap-3 text-xs text-[var(--text-muted)]"
                style={{ animation: 'authFadeUp 0.4s 0.65s both' }}
              >
                <CountdownRing seconds={countdown} total={AUTO_REDIRECT_SECONDS} />
                <span>
                  Redirecting to trading in{' '}
                  <span className="tabular font-semibold text-[var(--text-primary)]">{countdown}s</span>
                  {' '}·{' '}
                  <button
                    type="button"
                    onClick={() => setCountdown(999)}
                    className="underline transition-colors duration-150 hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
                  >
                    Cancel
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* ── Quick-action cards ── */}
          <div
            className={`mt-5 grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}
            style={{
              opacity:    stage === 'visible' ? 1 : 0,
              transform:  stage === 'visible' ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 500ms 150ms, transform 500ms 150ms',
            }}
          >
            {QUICK_ACTIONS.map((action, idx) => {
              const ts = TONE_STYLES[action.tone];
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="group flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-5 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)] hover:shadow-[0_4px_24px_var(--accent-muted)]"
                  style={{
                    background: 'var(--bg-elevated)',
                    animation: `authFadeUp 0.4s ${0.7 + idx * 0.1}s both`,
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110"
                    style={{ background: ts.bg, color: ts.color }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{action.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{action.desc}</p>
                  </div>
                  <div
                    className="mt-auto inline-flex items-center gap-1 text-xs font-semibold transition-all duration-150 group-hover:gap-2"
                    style={{ color: ts.color }}
                  >
                    {action.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Footer note ── */}
          <p
            className="mt-8 text-center text-[11px] text-[var(--text-muted)]"
            style={{ animation: 'authFadeUp 0.4s 1.0s both' }}
          >
            {BRAND} · Institutional-grade trading · Not financial advice ·{' '}
            <Link href="/profile?tab=security" className="underline hover:text-[var(--text-secondary)]">
              Secure your account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default withAuth(WelcomePage);