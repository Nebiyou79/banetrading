// components/auth/AuthLayout.tsx
// ── Split-screen auth layout ──

import { ReactNode } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { AuthHeader } from './AuthHeader';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Candlestick backdrop SVG — brand-column decoration.
 * Colors reference CSS vars driven by color.ts token injection:
 *   var(--success)      → chart.up  (green)
 *   var(--error)        → chart.down (red)
 *   var(--text-muted)   → grid lines
 *   var(--primary)      → MA line highlight
 */
function CandlestickBackdrop(): JSX.Element {
  return (
    <svg
      viewBox="0 0 600 400"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
        {/* Subtle gold glow for the ascending trend line */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Horizontal grid lines */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1="0"
          y1={i * 40}
          x2="600"
          y2={i * 40}
          stroke="url(#grid-fade)"
          strokeWidth="1"
        />
      ))}

      {/* Vertical grid lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * 40}
          y1="0"
          x2={i * 40}
          y2="400"
          stroke="var(--text-muted)"
          strokeOpacity="0.04"
          strokeWidth="1"
        />
      ))}

      {/* MA trend line — gold accent */}
      <polyline
        points="40,240 80,215 120,185 160,150 200,155 240,125 280,140 320,115 360,90 400,100 440,70 480,45 520,55 560,28"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeOpacity="0.35"
        filter="url(#glow)"
      />

      {/* Candles */}
      {[
        { x: 40,  up: true,  o: 240, c: 200, hi: 180, lo: 260 },
        { x: 80,  up: false, o: 200, c: 230, hi: 190, lo: 250 },
        { x: 120, up: true,  o: 230, c: 180, hi: 160, lo: 240 },
        { x: 160, up: true,  o: 180, c: 140, hi: 130, lo: 200 },
        { x: 200, up: false, o: 140, c: 170, hi: 130, lo: 190 },
        { x: 240, up: true,  o: 170, c: 120, hi: 110, lo: 190 },
        { x: 280, up: false, o: 120, c: 160, hi: 110, lo: 180 },
        { x: 320, up: true,  o: 160, c: 110, hi: 100, lo: 170 },
        { x: 360, up: true,  o: 110, c: 80,  hi: 70,  lo: 130 },
        { x: 400, up: false, o: 80,  c: 110, hi: 70,  lo: 130 },
        { x: 440, up: true,  o: 110, c: 60,  hi: 50,  lo: 130 },
        { x: 480, up: true,  o: 60,  c: 30,  hi: 20,  lo: 80  },
        { x: 520, up: false, o: 30,  c: 60,  hi: 20,  lo: 80  },
        { x: 560, up: true,  o: 60,  c: 20,  hi: 10,  lo: 80  },
      ].map((c) => {
        // var(--success) = chart.up green  |  var(--error) = chart.down red
        const color = c.up ? 'var(--success)' : 'var(--error)';
        const top = Math.min(c.o, c.c);
        const h = Math.abs(c.o - c.c) || 2;
        return (
          <g key={c.x} opacity="0.40">
            <line x1={c.x} y1={c.hi} x2={c.x} y2={c.lo} stroke={color} strokeWidth="1" />
            <rect x={c.x - 6} y={top} width="12" height={h} fill={color} rx="1" />
          </g>
        );
      })}
    </svg>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps): JSX.Element {
  const { isMobile, isTablet } = useResponsive();
  const stacked = isMobile || isTablet;

  return (
    /*
     * Root wrapper:
     *   bg-[var(--background)]  → neutral[900] dark | neutral[50] light
     *   text-[var(--text-primary)] → neutral[50] dark | neutral[900] light
     */
    <div className="min-h-screen w-full bg-[var(--background)] text-[var(--text-primary)]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        {/* ── LEFT / brand column ── */}
        {!stacked && (
          <aside
            className="
              relative hidden lg:flex lg:w-[45%] xl:w-[48%]
              flex-col justify-between overflow-hidden
              bg-[var(--surface)]
              border-r border-[var(--border)]
            "
          >
            <CandlestickBackdrop />

            {/* Top: logo header */}
            <div className="relative z-10 p-10">
              <AuthHeader showBackLink={false} />
            </div>

            {/* Middle: hero copy + stats */}
            <div className="relative z-10 p-10">
              <h2 className="text-4xl xl:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
                Trade crypto,{' '}
                <span className="text-[var(--primary)]">the simple way.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm text-[var(--text-secondary)] leading-relaxed">
                A streamlined exchange experience with transparent pricing, fast execution,
                and tools that don&apos;t get in your way.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                <Stat label="24h Volume" value="$1.2B" />
                <Stat label="Assets"    value="180+"  />
                <Stat label="Uptime"    value="99.99%" />
              </div>
            </div>

            {/* Bottom: copyright */}
            <div className="relative z-10 p-10 text-xs text-[var(--text-muted)]">
              © {new Date().getFullYear()} {BRAND}. All rights reserved.
            </div>
          </aside>
        )}

        {/* ── RIGHT / form column ── */}
        <main className="flex w-full flex-1 flex-col">
          {/* Mobile header */}
          <div className="px-6 pt-6 lg:hidden">
            <AuthHeader />
          </div>

          {/* Centered form area */}
          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
            <div className="w-full max-w-md">
              {/* Title block */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/*
               * Card shell:
               *   bg-[var(--card)]    → neutral[800] dark | white light
               *   border-[var(--border)] → neutral[700] dark | neutral[200] light
               *   shadow via Tailwind shadow-lg (or map to a CSS var if desired)
               */}
              <div
                className="
                  rounded-card border border-[var(--border)]
                  bg-[var(--card)]
                  p-6 sm:p-8
                  shadow-lg
                "
              >
                {children}
              </div>

              {footer && (
                <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    /*
     * Stat chip:
     *   bg-[var(--background)]/60  — translucent page bg
     *   border-[var(--border)]     — subtle rim
     *   backdrop-blur              — glass depth
     */
    <div
      className="
        rounded-card border border-[var(--border)]
        bg-[var(--background)]/60
        px-3 py-2.5 backdrop-blur-sm
      "
    >
      <div className="text-sm font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
    </div>
  );
}
