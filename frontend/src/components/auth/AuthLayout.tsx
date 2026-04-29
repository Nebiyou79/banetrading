// components/auth/AuthLayout.tsx
// ── BaneTrading — Split-screen auth layout with per-page accent themes ──
// Each page gets a unique background SVG + accent override via props

import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { AuthHeader } from './AuthHeader';

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

// ── Per-page accent overrides ──
const PAGE_THEME_VARS: Record<PageTheme, Record<string, string>> = {
  indigo: {
    '--page-accent':          '#6366F1',
    '--page-accent-hover':    '#818CF8',
    '--page-accent-muted':    'rgba(99,102,241,0.18)',
    '--page-accent-glow':     'rgba(99,102,241,0.35)',
    '--page-gradient-from':   '#070A13',
    '--page-gradient-to':     '#0C1028',
  },
  teal: {
    '--page-accent':          '#10D98A',
    '--page-accent-hover':    '#34D399',
    '--page-accent-muted':    'rgba(16,217,138,0.18)',
    '--page-accent-glow':     'rgba(16,217,138,0.30)',
    '--page-gradient-from':   '#050E0B',
    '--page-gradient-to':     '#071510',
  },
  violet: {
    '--page-accent':          '#A78BFA',
    '--page-accent-hover':    '#C4B5FD',
    '--page-accent-muted':    'rgba(167,139,250,0.18)',
    '--page-accent-glow':     'rgba(167,139,250,0.32)',
    '--page-gradient-from':   '#0A0714',
    '--page-gradient-to':     '#100C22',
  },
  amber: {
    '--page-accent':          '#FBBF24',
    '--page-accent-hover':    '#FDE68A',
    '--page-accent-muted':    'rgba(251,191,36,0.18)',
    '--page-accent-glow':     'rgba(251,191,36,0.28)',
    '--page-gradient-from':   '#0E0B04',
    '--page-gradient-to':     '#181408',
  },
  rose: {
    '--page-accent':          '#FB7185',
    '--page-accent-hover':    '#FDA4AF',
    '--page-accent-muted':    'rgba(251,113,133,0.18)',
    '--page-accent-glow':     'rgba(251,113,133,0.30)',
    '--page-gradient-from':   '#0E0608',
    '--page-gradient-to':     '#160A0C',
  },
};

// Light theme overrides per page
const PAGE_THEME_LIGHT_VARS: Record<PageTheme, Record<string, string>> = {
  indigo: {
    '--page-accent':          '#4F46E5',
    '--page-accent-hover':    '#6366F1',
    '--page-accent-muted':    'rgba(79,70,229,0.12)',
    '--page-accent-glow':     'rgba(79,70,229,0.25)',
    '--page-gradient-from':   '#EEF2FF',
    '--page-gradient-to':     '#E0E7FF',
  },
  teal: {
    '--page-accent':          '#059669',
    '--page-accent-hover':    '#10B981',
    '--page-accent-muted':    'rgba(5,150,105,0.12)',
    '--page-accent-glow':     'rgba(5,150,105,0.25)',
    '--page-gradient-from':   '#ECFDF5',
    '--page-gradient-to':     '#D1FAE5',
  },
  violet: {
    '--page-accent':          '#7C3AED',
    '--page-accent-hover':    '#6D28D9',
    '--page-accent-muted':    'rgba(124,58,237,0.12)',
    '--page-accent-glow':     'rgba(124,58,237,0.25)',
    '--page-gradient-from':   '#F5F3FF',
    '--page-gradient-to':     '#EDE9FE',
  },
  amber: {
    '--page-accent':          '#D97706',
    '--page-accent-hover':    '#B45309',
    '--page-accent-muted':    'rgba(217,119,6,0.12)',
    '--page-accent-glow':     'rgba(217,119,6,0.25)',
    '--page-gradient-from':   '#FFFBEB',
    '--page-gradient-to':     '#FEF3C7',
  },
  rose: {
    '--page-accent':          '#E11D48',
    '--page-accent-hover':    '#BE123C',
    '--page-accent-muted':    'rgba(225,29,72,0.12)',
    '--page-accent-glow':     'rgba(225,29,72,0.25)',
    '--page-gradient-from':   '#FFF1F2',
    '--page-gradient-to':     '#FFE4E6',
  },
};

// ── SVG Background Components ──

function CandlestickBg({ accent, isDark }: { accent: string; isDark: boolean }): JSX.Element {
  const gridOpacity = isDark ? '0.05' : '0.08';
  const lineOpacity = isDark ? '0.45' : '0.35';
  const areaOpacity = isDark ? '0.6' : '0.4';

  return (
    <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cg-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
        </linearGradient>
        <filter id="cg-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="cg-spot" cx="65%" cy="25%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.1' : '0.08'} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="700" height="500" fill="url(#cg-spot)" />
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 40} x2="700" y2={i * 40}
          stroke={accent} strokeOpacity={gridOpacity} strokeWidth="1" />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="500"
          stroke={accent} strokeOpacity="0.03" strokeWidth="1" />
      ))}
      <polyline
        points="40,360 80,320 130,280 180,230 230,240 280,195 340,210 390,170 440,135 490,150 540,105 590,70 650,80 700,45"
        fill="none" stroke={accent} strokeWidth="2.5" strokeOpacity={lineOpacity} filter="url(#cg-glow)" />
      <polygon
        points="40,360 80,320 130,280 180,230 230,240 280,195 340,210 390,170 440,135 490,150 540,105 590,70 650,80 700,45 700,500 40,500"
        fill="url(#cg-area)" opacity={areaOpacity} />
      {[
        { x:60,  up:true,  o:340, c:295, hi:275, lo:360 },
        { x:105, up:false, o:295, c:330, hi:280, lo:355 },
        { x:150, up:true,  o:330, c:270, hi:255, lo:350 },
        { x:195, up:true,  o:270, c:215, hi:200, lo:290 },
        { x:240, up:false, o:215, c:255, hi:205, lo:280 },
        { x:285, up:true,  o:255, c:188, hi:175, lo:270 },
        { x:330, up:false, o:188, c:225, hi:178, lo:250 },
        { x:375, up:true,  o:225, c:165, hi:155, lo:240 },
        { x:420, up:true,  o:165, c:125, hi:112, lo:180 },
        { x:465, up:false, o:125, c:158, hi:118, lo:175 },
        { x:510, up:true,  o:158, c:98,  hi:85,  lo:172 },
        { x:555, up:true,  o:98,  c:62,  hi:48,  lo:115 },
        { x:600, up:false, o:62,  c:88,  hi:52,  lo:105 },
        { x:645, up:true,  o:88,  c:42,  hi:30,  lo:100 },
      ].map((c) => {
        const color = c.up
          ? (isDark ? '#10D98A' : '#059669')
          : (isDark ? '#F43F5E' : '#E11D48');
        const top = Math.min(c.o, c.c);
        const h = Math.max(Math.abs(c.o - c.c), 3);
        return (
          <g key={c.x} opacity={isDark ? '0.6' : '0.55'}>
            <line x1={c.x} y1={c.hi} x2={c.x} y2={c.lo} stroke={color} strokeWidth="1.5" />
            <rect x={c.x - 8} y={top} width="16" height={h} fill={color} rx="1.5" />
          </g>
        );
      })}
    </svg>
  );
}

function NetworkBg({ accent, isDark }: { accent: string; isDark: boolean }): JSX.Element {
  const nodes: [number, number][] = [
    [120,100],[300,80],[520,120],[680,200],[600,320],[420,400],[200,380],[80,260],
    [350,220],[480,160],[160,200],[540,300],
  ];
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[1,8],[8,4],[2,9],[9,8],[7,10],[10,8],[4,11],[11,8]];
  return (
    <svg viewBox="0 0 760 480" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="ng-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.12' : '0.09'} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id="ng-blur"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="760" height="480" fill="url(#ng-glow)" />
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={accent} strokeOpacity={isDark ? '0.15' : '0.12'} strokeWidth="1" />
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 8 ? 10 : 4.5} fill={accent} opacity={i === 8 ? (isDark ? 0.6 : 0.5) : 0.3} />
          <circle cx={x} cy={y} r={i === 8 ? 20 : 10} fill={accent} opacity="0.05" />
        </g>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={0} y1={60 * i + 30} x2={760} y2={60 * i + 30}
          stroke={accent} strokeOpacity="0.03" strokeWidth="1" strokeDasharray="4 8" />
      ))}
    </svg>
  );
}

function WavesBg({ accent, isDark }: { accent: string; isDark: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="wv-center" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.14' : '0.1'} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id="wv-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="700" height="500" fill="url(#wv-center)" />
      {[0, 60, 120, 180, 240].map((offset, i) => (
        <path key={i}
          d={`M0,${200 + offset} Q175,${150 + offset - i * 10} 350,${200 + offset} Q525,${250 + offset + i * 10} 700,${200 + offset}`}
          fill="none" stroke={accent}
          strokeOpacity={isDark ? (0.18 - i * 0.025) : (0.14 - i * 0.02)}
          strokeWidth={3 - i * 0.4}
          filter={i === 0 ? 'url(#wv-glow)' : undefined}
        />
      ))}
      {/* Concentric rings */}
      {[60, 120, 180, 240, 300].map((r, i) => (
        <circle key={r} cx="420" cy="200" r={r}
          fill="none" stroke={accent}
          strokeOpacity={isDark ? (0.06 - i * 0.008) : (0.05 - i * 0.007)}
          strokeWidth="1" />
      ))}
    </svg>
  );
}

function HexagonBg({ accent, isDark }: { accent: string; isDark: boolean }): JSX.Element {
  const hexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  };

  const hexagons = [
    [100, 100, 45], [200, 100, 30], [320, 80, 50], [460, 110, 35], [580, 90, 42], [660, 150, 28],
    [140, 220, 35], [280, 200, 55], [440, 230, 38], [600, 210, 45], [700, 280, 32],
    [80, 340, 40], [220, 360, 32], [380, 340, 48], [530, 360, 36], [660, 330, 44],
    [160, 460, 28], [320, 440, 42], [500, 460, 30], [640, 430, 38],
  ];

  return (
    <svg viewBox="0 0 760 500" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hex-glow" cx="55%" cy="40%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.12' : '0.09'} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="760" height="500" fill="url(#hex-glow)" />
      {hexagons.map(([cx, cy, r], i) => (
        <polygon key={i} points={hexPoints(cx, cy, r)}
          fill="none" stroke={accent}
          strokeOpacity={isDark ? (0.1 - (i % 4) * 0.015) : (0.08 - (i % 4) * 0.012)}
          strokeWidth="1" />
      ))}
      {/* Filled accent hexagons */}
      {[[320, 80, 50], [440, 230, 38]].map(([cx, cy, r], i) => (
        <polygon key={`f${i}`} points={hexPoints(cx, cy, r * 0.4)}
          fill={accent} opacity={isDark ? '0.18' : '0.12'} />
      ))}
    </svg>
  );
}

function GridBg({ accent, isDark }: { accent: string; isDark: boolean }): JSX.Element {
  return (
    <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="gp-pat" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={accent}
            strokeOpacity={isDark ? '0.07' : '0.06'} strokeWidth="0.75" />
        </pattern>
        <radialGradient id="gp-spot" cx="65%" cy="30%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.14' : '0.1'} />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <filter id="gp-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="700" height="500" fill="url(#gp-pat)" />
      <rect width="700" height="500" fill="url(#gp-spot)" />
      {/* Trend line */}
      <polyline points="0,350 100,280 200,300 300,220 400,180 500,120 600,90 700,60"
        fill="none" stroke={accent} strokeWidth="2.5" strokeOpacity={isDark ? '0.5' : '0.4'}
        filter="url(#gp-glow)" />
      {/* Dot markers */}
      {[[100,280],[300,220],[500,120],[700,60]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill={accent} opacity={isDark ? '0.6' : '0.5'} />
      ))}
    </svg>
  );
}

function BackgroundSVG({
  variant, accent, isDark
}: {
  variant: AuthLayoutProps['backgroundVariant'];
  accent: string;
  isDark: boolean;
}): JSX.Element {
  switch (variant) {
    case 'network':  return <NetworkBg accent={accent} isDark={isDark} />;
    case 'waves':    return <WavesBg accent={accent} isDark={isDark} />;
    case 'hexagon':  return <HexagonBg accent={accent} isDark={isDark} />;
    case 'grid':     return <GridBg accent={accent} isDark={isDark} />;
    default:         return <CandlestickBg accent={accent} isDark={isDark} />;
  }
}

function BaneLogo({ size = 32 }: { size?: number }): JSX.Element {
  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden rounded-xl shrink-0"
      style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, var(--page-accent) 0%, var(--page-accent-hover) 100%)',
        boxShadow: '0 0 20px var(--page-accent-muted)',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Stylized B + chart icon */}
        <polyline points="6,22 10,14 14,18 19,10 26,13"
          stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="6,22 10,14 14,18 19,10 26,13"
          stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="16" y="28" textAnchor="middle" fontSize="10" fontWeight="900"
          fill="rgba(255,255,255,0.95)" fontFamily="system-ui, sans-serif">BT</text>
      </svg>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2.5 backdrop-blur-sm"
      style={{ borderColor: 'var(--page-accent-muted)' }}>
      <div className="tabular text-sm font-bold text-[var(--text-primary)]">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  pageTheme = 'indigo',
  backgroundVariant = 'candlestick',
  pillLabel = 'Secure Session',
}: AuthLayoutProps): JSX.Element {
  const { isMobile, isTablet } = useResponsive();
  const stacked = isMobile || isTablet;

  // Detect dark vs light to pick correct theme vars
  // We inject both sets and let CSS cascade via data-theme
  const darkVars = PAGE_THEME_VARS[pageTheme];
  const lightVars = PAGE_THEME_LIGHT_VARS[pageTheme];

  // We use the dark vars as JS inline style defaults;
  // light theme overrides happen via CSS [data-theme="light"] vars
  const themeVars = darkVars;
  const accent = darkVars['--page-accent'];

  // Left panel gradient (dark only — light panel is white surface)
  const leftBg = `linear-gradient(160deg, ${darkVars['--page-gradient-from']} 0%, ${darkVars['--page-gradient-to']} 100%)`;

  return (
    <div
      className="min-h-screen w-full bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-200"
      style={{
        ...themeVars as React.CSSProperties,
        // Light mode overrides for page-accent via CSS custom props
      } as React.CSSProperties}
    >
      {/* Light mode accent override via style tag approach via CSS vars */}
      <style>{`
        [data-theme="light"] {
          --page-accent: ${lightVars['--page-accent']};
          --page-accent-hover: ${lightVars['--page-accent-hover']};
          --page-accent-muted: ${lightVars['--page-accent-muted']};
          --page-accent-glow: ${lightVars['--page-accent-glow']};
          --page-gradient-from: ${lightVars['--page-gradient-from']};
          --page-gradient-to: ${lightVars['--page-gradient-to']};
        }
      `}</style>

      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        {/* ── LEFT brand column (desktop only) ── */}
        {!stacked && (
          <aside
            className="relative hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col justify-between overflow-hidden"
            style={{ background: leftBg }}
          >
            {/* Right edge glow line */}
            <div className="absolute inset-y-0 right-0 w-px"
              style={{ background: `linear-gradient(180deg, transparent 0%, ${accent}50 50%, transparent 100%)` }} />

            {/* Background pattern */}
            <BackgroundSVG variant={backgroundVariant} accent={accent} isDark={true} />

            {/* Top: Logo */}
            <div className="relative z-10 p-10">
              <div className="flex items-center gap-3">
                <BaneLogo size={40} />
                <div>
                  <div className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">{BRAND}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Pro Trading Platform</div>
                </div>
              </div>
            </div>

            {/* Middle: hero copy */}
            <div className="relative z-10 px-10 pb-6">
              {/* Live badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest"
                style={{ borderColor: `${accent}40`, color: accent, background: `${accent}12` }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                Live Markets · 240+ Assets
              </div>

              <h2 className="text-4xl xl:text-[2.75rem] font-extrabold tracking-tight leading-[1.1] text-[var(--text-primary)]">
                Trade the{' '}
                <span style={{ color: accent }}>edge.</span>
                <br />
                <span className="text-[var(--text-secondary)]">Own the outcome.</span>
              </h2>

              <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-[var(--text-secondary)]">
                Institutional-grade execution, transparent pricing, and real-time analytics — built for serious traders.
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-[320px]">
                <StatCard label="24h Volume" value="$2.4B" />
                <StatCard label="Assets" value="240+" />
                <StatCard label="Uptime" value="99.99%" />
              </div>

              {/* Live ticker strip */}
              <div className="mt-8 flex items-center gap-5 text-xs border-t pt-5" style={{ borderColor: `${accent}20` }}>
                {[
                  { sym: 'BTC/USDT', px: '67,420', chg: '+2.3%', up: true },
                  { sym: 'ETH/USDT', px: '3,512',  chg: '+1.8%', up: true },
                  { sym: 'SOL/USDT', px: '142.5',  chg: '-0.6%', up: false },
                ].map((t) => (
                  <div key={t.sym} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">{t.sym}</span>
                    <span className="tabular font-bold text-[var(--text-primary)] text-sm">{t.px}</span>
                    <span className={`tabular text-[11px] font-semibold ${t.up ? 'text-gain' : 'text-loss'}`}>{t.chg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: copyright */}
            <div className="relative z-10 px-10 pb-8 text-[11px] text-[var(--text-muted)]">
              © {new Date().getFullYear()} {BRAND}. All rights reserved.{' '}
              <span className="opacity-60">Trading involves significant risk.</span>
            </div>
          </aside>
        )}

        {/* ── RIGHT form column ── */}
        <main className="flex w-full flex-1 flex-col bg-[var(--background)]">

          {/* Mobile header */}
          {stacked && (
            <div className="px-5 pt-5 pb-2">
              <AuthHeader pageTheme={pageTheme} />
            </div>
          )}

          {/* Form area */}
          <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
            <div className="w-full max-w-[420px]">

              {/* Desktop mini-header (right panel) */}
              {!stacked && (
                <div className="mb-6">
                  <AuthHeader pageTheme={pageTheme} showBackLink={false} compact />
                </div>
              )}

              {/* Title block */}
              <div className="mb-6">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] uppercase tracking-widest font-medium"
                  style={{ borderColor: 'var(--page-accent-muted)', color: 'var(--page-accent)', background: 'var(--page-accent-muted)' }}>
                  <span className="h-1 w-1 rounded-full animate-pulse" style={{ background: 'var(--page-accent)' }} />
                  {pillLabel}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>
                )}
              </div>

              {/* Form card */}
              <div
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 shadow-2xl"
                style={{ boxShadow: `0 8px 48px var(--page-accent-glow), 0 0 0 1px var(--border)` }}
              >
                {children}
              </div>

              {/* Footer link */}
              {footer && (
                <div className="mt-5 text-center text-sm text-[var(--text-secondary)]">
                  {footer}
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-5">
                {['256-bit SSL', 'SOC 2 Type II', 'GDPR Compliant'].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1L9 3v3.5C9 8.4 7.2 9.7 5 9.7S1 8.4 1 6.5V3L5 1z"
                        fill="var(--page-accent)" opacity="0.6" />
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
