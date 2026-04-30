// components/auth/AuthLayout.tsx
// ── BaneTrading — Split-screen auth layout with per-page accent themes ──

import { ReactNode, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useResponsive } from '@/hooks/useResponsive';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const BRAND = 'BaneTrading';

export type PageTheme = 'indigo' | 'teal' | 'violet' | 'amber' | 'rose';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  pageTheme?: PageTheme;
  backgroundVariant?: 'candlestick' | 'grid' | 'network' | 'waves' | 'hexagon';
  pillLabel?: string;
}

// ── Per-page background images — dark AND light variants switch on theme change ──
const PAGE_BG_IMAGES: Record<PageTheme, { dark: string; light: string }> = {
  indigo: { dark: '/assets/auth/login-dark.jpg',    light: '/assets/auth/login-light.jpg'    },
  teal:   { dark: '/assets/auth/register-dark.jpg', light: '/assets/auth/register-light.jpg' },
  violet: { dark: '/assets/auth/verify-dark.jpg',   light: '/assets/auth/verify-light.jpg'   },
  amber:  { dark: '/assets/auth/forgot-dark.jpg',   light: '/assets/auth/forgot-light.jpg'   },
  rose:   { dark: '/assets/auth/reset-dark.jpg',    light: '/assets/auth/reset-light.jpg'    },
};

// ── Per-page accent overrides (dark) ──
const PAGE_THEME_VARS: Record<PageTheme, Record<string, string>> = {
  indigo: {
    '--page-accent':        '#6366F1',
    '--page-accent-hover':  '#818CF8',
    '--page-accent-muted':  'rgba(99,102,241,0.18)',
    '--page-accent-glow':   'rgba(99,102,241,0.35)',
    '--page-gradient-from': '#070A13',
    '--page-gradient-to':   '#0C1028',
  },
  teal: {
    '--page-accent':        '#10D98A',
    '--page-accent-hover':  '#34D399',
    '--page-accent-muted':  'rgba(16,217,138,0.18)',
    '--page-accent-glow':   'rgba(16,217,138,0.30)',
    '--page-gradient-from': '#050E0B',
    '--page-gradient-to':   '#071510',
  },
  violet: {
    '--page-accent':        '#A78BFA',
    '--page-accent-hover':  '#C4B5FD',
    '--page-accent-muted':  'rgba(167,139,250,0.18)',
    '--page-accent-glow':   'rgba(167,139,250,0.32)',
    '--page-gradient-from': '#0A0714',
    '--page-gradient-to':   '#100C22',
  },
  amber: {
    '--page-accent':        '#FBBF24',
    '--page-accent-hover':  '#FDE68A',
    '--page-accent-muted':  'rgba(251,191,36,0.18)',
    '--page-accent-glow':   'rgba(251,191,36,0.28)',
    '--page-gradient-from': '#0E0B04',
    '--page-gradient-to':   '#181408',
  },
  rose: {
    '--page-accent':        '#FB7185',
    '--page-accent-hover':  '#FDA4AF',
    '--page-accent-muted':  'rgba(251,113,133,0.18)',
    '--page-accent-glow':   'rgba(251,113,133,0.30)',
    '--page-gradient-from': '#0E0608',
    '--page-gradient-to':   '#160A0C',
  },
};

// ── Per-page accent overrides (light) ──
const PAGE_THEME_LIGHT_VARS: Record<PageTheme, Record<string, string>> = {
  indigo: {
    '--page-accent':        '#4F46E5',
    '--page-accent-hover':  '#6366F1',
    '--page-accent-muted':  'rgba(79,70,229,0.12)',
    '--page-accent-glow':   'rgba(79,70,229,0.25)',
    '--page-gradient-from': '#EEF2FF',
    '--page-gradient-to':   '#E0E7FF',
  },
  teal: {
    '--page-accent':        '#059669',
    '--page-accent-hover':  '#10B981',
    '--page-accent-muted':  'rgba(5,150,105,0.12)',
    '--page-accent-glow':   'rgba(5,150,105,0.25)',
    '--page-gradient-from': '#ECFDF5',
    '--page-gradient-to':   '#D1FAE5',
  },
  violet: {
    '--page-accent':        '#7C3AED',
    '--page-accent-hover':  '#6D28D9',
    '--page-accent-muted':  'rgba(124,58,237,0.12)',
    '--page-accent-glow':   'rgba(124,58,237,0.25)',
    '--page-gradient-from': '#F5F3FF',
    '--page-gradient-to':   '#EDE9FE',
  },
  amber: {
    '--page-accent':        '#D97706',
    '--page-accent-hover':  '#B45309',
    '--page-accent-muted':  'rgba(217,119,6,0.12)',
    '--page-accent-glow':   'rgba(217,119,6,0.25)',
    '--page-gradient-from': '#FFFBEB',
    '--page-gradient-to':   '#FEF3C7',
  },
  rose: {
    '--page-accent':        '#E11D48',
    '--page-accent-hover':  '#BE123C',
    '--page-accent-muted':  'rgba(225,29,72,0.12)',
    '--page-accent-glow':   'rgba(225,29,72,0.25)',
    '--page-gradient-from': '#FFF1F2',
    '--page-gradient-to':   '#FFE4E6',
  },
};

// ── Subtle animated candlestick decoration ──
function CandlestickOverlay({ isDark }: { isDark: boolean }): JSX.Element {
  return (
    <svg
      viewBox="0 0 700 500"
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ opacity: isDark ? 0.22 : 0.10 }}
      aria-hidden="true"
    >
      {[
        { x: 200, top: 180, h: 60, up: true  },
        { x: 260, top: 220, h: 40, up: false },
        { x: 320, top: 140, h: 80, up: true  },
        { x: 380, top: 160, h: 55, up: false },
        { x: 440, top: 100, h: 90, up: true  },
      ].map((c, i) => {
        const color = c.up
          ? (isDark ? '#10D98A' : '#059669')
          : (isDark ? '#F43F5E' : '#E11D48');
        return (
          <g key={i} style={{ animation: `candlePulse 3s ${i * 0.4}s ease-in-out infinite` }}>
            <line x1={c.x} y1={c.top - 15} x2={c.x} y2={c.top + c.h + 15}
              stroke={color} strokeWidth="1.5" />
            <rect x={c.x - 9} y={c.top} width="18" height={c.h}
              fill={color} rx="2" opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({ label, value, isDark }: { label: string; value: string; isDark: boolean }): JSX.Element {
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-center"
      style={{
        borderColor: 'var(--page-accent-muted)',
        background: isDark ? 'rgba(14,18,40,0.65)' : 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="tabular text-sm font-bold"
        style={{ color: isDark ? '#E4E9F8' : '#150830' }}
      >
        {value}
      </div>
      <div
        className="mt-0.5 text-[10px] uppercase tracking-widest"
        style={{ color: isDark ? 'rgba(165,180,252,0.80)' : 'rgba(91,58,140,0.80)' }}
      >
        {label}
      </div>
    </div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  pageTheme = 'indigo',
  pillLabel = 'Secure Session',
}: AuthLayoutProps): JSX.Element {
  const { isMobile, isTablet } = useResponsive();
  const stacked = isMobile || isTablet;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen bg-[var(--background)]" />;

  const isDark = resolvedTheme !== 'light';
  const darkVars  = PAGE_THEME_VARS[pageTheme];
  const lightVars = PAGE_THEME_LIGHT_VARS[pageTheme];
  const themeVars = isDark ? darkVars : lightVars;
  const accent    = themeVars['--page-accent'];

  // Pick image based on CURRENT resolved theme — changes reactively
  const currentImage = PAGE_BG_IMAGES[pageTheme][isDark ? 'dark' : 'light'];

  // Theme-aware left panel text colors
  const leftPanelTextColor  = isDark ? '#E4E9F8'                : '#150830';
  const leftPanelSubColor   = isDark ? '#A5B4FC'                : '#5B3A8C';
  const leftPanelMutedColor = isDark ? 'rgba(165,180,252,0.85)' : 'rgba(91,58,140,0.85)';

  return (
    <div
      className="min-h-screen w-full bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300"
      style={{ ...themeVars as React.CSSProperties }}
    >
      <style>{`
        [data-theme="light"] {
          --page-accent:        ${lightVars['--page-accent']};
          --page-accent-hover:  ${lightVars['--page-accent-hover']};
          --page-accent-muted:  ${lightVars['--page-accent-muted']};
          --page-accent-glow:   ${lightVars['--page-accent-glow']};
          --page-gradient-from: ${lightVars['--page-gradient-from']};
          --page-gradient-to:   ${lightVars['--page-gradient-to']};
        }
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes authFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes candlePulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.90; }
        }
        @keyframes ctaPulse {
          0%   { box-shadow: 0 0 0 0 var(--page-accent-muted); }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes successBounce {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes barFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes animate-otp-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>

      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        {/* ════════════════════════════════════════════════
            LEFT PANEL — desktop only
            ════════════════════════════════════════════════ */}
        {!stacked && (
          <aside
            className="relative hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col overflow-hidden"
            aria-hidden="true"
          >
            {/* ── Layer 0: Background photo
                   key={currentImage} forces React to unmount/remount the <Image>
                   when the src changes (theme toggle), triggering a fresh load + fade ── */}
            <div className="absolute inset-0 z-0">
              <Image
                key={currentImage}
                src={currentImage}
                alt=""
                fill
                priority
                sizes="50vw"
                className="object-cover"
                style={{
                  objectPosition: 'center center',
                  opacity: isDark ? 0.90 : 0.80,
                  transition: 'opacity 0.5s ease',
                }}
              />
            </div>

            {/* ── Layer 1: Left-side readability gradient ── */}
            <div
              className="absolute inset-0 z-[1]"
              style={{
                background: isDark
                  ? 'linear-gradient(to right, rgba(7,10,19,0.88) 0%, rgba(7,10,19,0.65) 50%, rgba(7,10,19,0.15) 100%)'
                  : 'linear-gradient(to right, rgba(235,240,255,0.92) 0%, rgba(235,240,255,0.68) 50%, rgba(235,240,255,0.10) 100%)',
                transition: 'background 0.4s ease',
              }}
            />

            {/* ── Layer 2: Bottom fade for ticker ── */}
            <div
              className="absolute inset-0 z-[2]"
              style={{
                background: isDark
                  ? 'linear-gradient(to top, rgba(7,10,19,0.75) 0%, transparent 30%)'
                  : 'linear-gradient(to top, rgba(235,240,255,0.75) 0%, transparent 30%)',
              }}
            />

            {/* ── Layer 3: Accent radial glow ── */}
            <div
              className="absolute inset-0 z-[3]"
              style={{
                background: `radial-gradient(ellipse at 50% 45%, ${accent}20 0%, transparent 65%)`,
              }}
            />

            {/* ── Layer 4: Candlestick decoration ── */}
            <div className="absolute inset-0 z-[4] pointer-events-none">
              <CandlestickOverlay isDark={isDark} />
            </div>

            {/* ── Right edge separator line ── */}
            <div
              className="absolute inset-y-0 right-0 w-px z-[5]"
              style={{
                background: `linear-gradient(180deg, transparent 0%, ${accent}60 50%, transparent 100%)`,
              }}
            />

            {/* ════════════════════════════════════════════════
                CONTENT — everything centered, z-20
                ════════════════════════════════════════════════ */}
            <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-8 xl:px-14 py-12 text-center">

              {/* LOGO — large, centered */}
              <div
                className="relative mb-5 h-28 w-28 rounded-3xl overflow-hidden"
                style={{
                  boxShadow: `0 0 48px ${accent}55, 0 12px 40px rgba(0,0,0,0.45)`,
                }}
              >
                <Image
                  src="/assets/logo.jpg"
                  alt="BaneTrading logo"
                  fill
                  sizes="112px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Brand name — centered, below logo */}
              <p
                className="text-2xl xl:text-[1.75rem] font-black tracking-tight"
                style={{ color: leftPanelTextColor }}
              >
                {BRAND}
              </p>
              <p
                className="mt-1 mb-10 text-[10px] uppercase tracking-[0.22em]"
                style={{ color: leftPanelMutedColor }}
              >
                Pro Trading Platform
              </p>

              {/* Live badge */}
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-widest"
                style={{
                  borderColor: `${accent}45`,
                  color:       accent,
                  background:  `${accent}14`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: accent }}
                />
                Live Markets · 240+ Assets
              </div>

              {/* Headline — centered */}
              <h2
                className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.15]"
                style={{ color: leftPanelTextColor }}
              >
                Trade the{' '}
                <span style={{ color: accent }}>edge.</span>
                <br />
                <span style={{ color: leftPanelSubColor }}>Own the outcome.</span>
              </h2>

              {/* Subtitle — centered */}
              <p
                className="mx-auto mt-4 mb-10 max-w-[280px] text-sm leading-relaxed"
                style={{ color: leftPanelMutedColor }}
              >
                Institutional-grade execution, transparent pricing, and real-time analytics — built for serious traders.
              </p>

              {/* Stats — centered grid */}
              <div className="mb-10 grid grid-cols-3 gap-3 w-full max-w-[310px]">
                <StatCard label="24h Volume" value="$2.4B"  isDark={isDark} />
                <StatCard label="Assets"     value="240+"   isDark={isDark} />
                <StatCard label="Uptime"     value="99.99%" isDark={isDark} />
              </div>

              {/* Live ticker — centered */}
              <div
                className="flex items-center justify-center gap-8 text-xs border-t pt-6 w-full max-w-[320px]"
                style={{ borderColor: `${accent}28` }}
              >
                {[
                  { sym: 'BTC/USDT', px: '67,420', chg: '+2.3%', up: true  },
                  { sym: 'ETH/USDT', px: '3,512',  chg: '+1.8%', up: true  },
                  { sym: 'SOL/USDT', px: '142.5',  chg: '-0.6%', up: false },
                ].map((t) => (
                  <div key={t.sym} className="flex flex-col items-center gap-0.5">
                    <span
                      className="text-[10px] font-medium uppercase tracking-wide"
                      style={{ color: leftPanelMutedColor }}
                    >
                      {t.sym}
                    </span>
                    <span
                      className="tabular font-bold text-sm"
                      style={{ color: leftPanelTextColor }}
                    >
                      {t.px}
                    </span>
                    <span
                      className="tabular text-[11px] font-semibold"
                      style={{
                        color: t.up
                          ? (isDark ? '#10D98A' : '#059669')
                          : (isDark ? '#F43F5E' : '#E11D48'),
                      }}
                    >
                      {t.chg}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom copyright */}
            <div
              className="relative z-20 text-center px-8 pb-6 text-[11px]"
              style={{ color: leftPanelMutedColor }}
            >
              © {new Date().getFullYear()} {BRAND}. All rights reserved.{' '}
              <span className="opacity-60">Trading involves significant risk.</span>
            </div>
          </aside>
        )}

        {/* ════════════════════════════════════════════════
            RIGHT PANEL — form area (full width on mobile)
            ════════════════════════════════════════════════ */}
        <main className="flex w-full flex-1 flex-col bg-[var(--background)]">

          {/* Theme toggle — top-right, always present, NO logo/name here */}
          <div className="flex justify-end px-5 pt-5">
            <ThemeToggle />
          </div>

          {/* ── Mobile / tablet: logo + brand name centered at top ── */}
          {stacked && (
            <div
              className="flex flex-col items-center pt-2 pb-4"
              style={{ animation: 'authFadeIn 0.4s 0.05s both' }}
            >
              <div
                className="relative mb-3 h-16 w-16 rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 0 24px var(--page-accent-muted)' }}
              >
                <Image
                  src="/assets/logo.jpg"
                  alt="BaneTrading"
                  fill
                  sizes="64px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
                {BRAND}
              </span>
              <span className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Pro Trading
              </span>
            </div>
          )}

          {/* Form — vertically and horizontally centered */}
          <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
            <div
              className="w-full max-w-[440px]"
              style={{ animation: 'authFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both' }}
            >
              {/* Pill label + title */}
              <div className="mb-6">
                <div
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest font-medium"
                  style={{
                    borderColor: 'var(--page-accent-muted)',
                    color:       'var(--page-accent)',
                    background:  'var(--page-accent-muted)',
                    animation:   'authFadeIn 0.4s 0.05s both',
                  }}
                >
                  <span
                    className="h-1 w-1 rounded-full animate-pulse"
                    style={{ background: 'var(--page-accent)' }}
                  />
                  {pillLabel}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form card */}
              <div
                className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-2xl transition-shadow duration-300"
                style={{
                  boxShadow: `0 8px 48px var(--page-accent-glow), 0 0 0 1px var(--border)`,
                  animation: 'authFadeUp 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both',
                }}
              >
                {/* Accent top border line */}
                <div
                  className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, var(--page-accent), transparent)',
                  }}
                />
                {children}
              </div>

              {/* Footer link */}
              {footer && (
                <div className="mt-5 text-center text-sm text-[var(--text-secondary)]">
                  {footer}
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
                {['256-bit SSL', 'SOC 2 Type II', 'GDPR Compliant'].map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wide"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M5 1L9 3v3.5C9 8.4 7.2 9.7 5 9.7S1 8.4 1 6.5V3L5 1z"
                        fill="var(--page-accent)"
                        opacity="0.6"
                      />
                    </svg>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}