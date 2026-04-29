// pages/news.tsx
// ── BaneTrading — News & Market Commentary page (Binance/Bybit standard) ──

import Head from 'next/head';
import { useState } from 'react';
import { Quote, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { FeaturedArticle } from '@/components/news/FeaturedArticle';
import { NewsGrid } from '@/components/news/NewsGrid';
import type { NewsArticle } from '@/types/news';

const BRAND = 'BaneTrading';

// ── Static article data ──
const ARTICLES: NewsArticle[] = [
  {
    id: 'feat-1',
    title: 'Bitcoin reclaims $70K after Fed signal',
    excerpt:
      'A dovish tone from the Federal Reserve sent Bitcoin back above $70,000 this week, reviving conversations about a sustained leg higher into the second half of the year.',
    imageUrl: 'https://images.unsplash.com/photo-1518544801976-3e188ea7e1cf?auto=format&fit=crop&w=1600&q=80',
    category: 'Bitcoin',
    publishedAt: '2026-04-23T10:00:00Z',
    readMinutes: 6,
    href: '#',
  },
  {
    id: 'a-1',
    title: "Ethereum's next upgrade roadmap",
    excerpt:
      'Core developers outlined the next set of EIPs targeted for the upcoming hard fork, with a continued focus on data availability and execution efficiency.',
    imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1200&q=80',
    category: 'Ethereum',
    publishedAt: '2026-04-22T08:30:00Z',
    readMinutes: 5,
    href: '#',
  },
  {
    id: 'a-2',
    title: 'Stablecoin supply hits new ATH',
    excerpt:
      'Aggregate stablecoin supply continued its climb past prior all-time highs, signalling continued risk-on positioning across the broader crypto market.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
    category: 'Markets',
    publishedAt: '2026-04-21T15:00:00Z',
    readMinutes: 4,
    href: '#',
  },
  {
    id: 'a-3',
    title: 'Solana DeFi TVL surges 40%',
    excerpt:
      "Solana's on-chain DeFi total value locked climbed 40% over the past month as new protocols and bridge inflows captured user attention.",
    imageUrl: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=1200&q=80',
    category: 'DeFi',
    publishedAt: '2026-04-20T11:45:00Z',
    readMinutes: 4,
    href: '#',
  },
  {
    id: 'a-4',
    title: 'Regulatory clarity in the EU: MiCA update',
    excerpt:
      'The latest round of MiCA implementation guidance offered new clarity for stablecoin issuers and exchange operators across the European Union.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    category: 'Regulation',
    publishedAt: '2026-04-19T09:15:00Z',
    readMinutes: 7,
    href: '#',
  },
  {
    id: 'a-5',
    title: 'Why spot ETF flows matter',
    excerpt:
      'Daily flows into spot crypto ETFs continue to act as a directional signal for the broader market — here is what to track and why it matters.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    category: 'Markets',
    publishedAt: '2026-04-18T14:00:00Z',
    readMinutes: 5,
    href: '#',
  },
  {
    id: 'a-6',
    title: 'Market outlook: Q2 2026',
    excerpt:
      'A look at the macro backdrop, key crypto-native catalysts, and the on-chain indicators most worth watching as we head into the second quarter.',
    imageUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=80',
    category: 'Markets',
    publishedAt: '2026-04-17T16:30:00Z',
    readMinutes: 8,
    href: '#',
  },
];

// ── Pull quotes ──
const PULL_QUOTES = [
  {
    quote: 'Liquidity is the only narrative that matters in the short term — flows lead price.',
    author: 'Macro desk note',
    tone: 'accent' as const,
  },
  {
    quote: 'Spot ETFs have become the cleanest read of institutional appetite for crypto exposure.',
    author: 'Research weekly',
    tone: 'info' as const,
  },
  {
    quote: 'Stablecoin supply is the closest thing crypto has to a leading indicator.',
    author: 'On-chain commentary',
    tone: 'success' as const,
  },
];

// ── Market snapshot data ──
const MARKET_SNAPSHOT = [
  { sym: 'BTC/USDT', price: '67,420.50', change: '+2.34', up: true,  cap: '$1.33T'  },
  { sym: 'ETH/USDT', price: '3,512.80',  change: '+1.82', up: true,  cap: '$421B'   },
  { sym: 'SOL/USDT', price: '142.35',    change: '-0.61', up: false, cap: '$65B'    },
  { sym: 'BNB/USDT', price: '608.90',    change: '+0.94', up: true,  cap: '$88B'    },
];

const QUOTE_TONE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  accent:  { bg: 'var(--accent-muted)',  color: 'var(--accent)',  border: 'var(--accent)'  },
  info:    { bg: 'var(--info-muted)',    color: 'var(--info)',    border: 'var(--info)'    },
  success: { bg: 'var(--success-muted)', color: 'var(--success)', border: 'var(--success)' },
};

// ── Mini sparkline ──
function Sparkline({ up }: { up: boolean }): JSX.Element {
  const pts = up
    ? '0,20 16,16 32,12 48,14 64,8  80,6  96,3'
    : '0,4  16,8  32,12 48,10 64,16 80,18 96,22';
  return (
    <svg width="96" height="24" viewBox="0 0 96 24" fill="none" className="opacity-80">
      <polyline
        points={pts}
        stroke={up ? 'var(--success)' : 'var(--danger)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Market snapshot panel ──
function MarketSnapshot(): JSX.Element {
  return (
    <aside className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Market snapshot
        </p>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: 'var(--success-muted)', color: 'var(--success)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
          Live
        </span>
      </div>

      {/* Rows */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)]" style={{ background: 'var(--bg-elevated)' }}>
        {MARKET_SNAPSHOT.map((m, i) => (
          <div
            key={m.sym}
            className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-100 hover:bg-[var(--hover-bg)] ${i < MARKET_SNAPSHOT.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-semibold text-[var(--text-primary)]">{m.sym.split('/')[0]}</span>
              <span className="tabular text-[10px] text-[var(--text-muted)]">Cap: {m.cap}</span>
            </div>
            <Sparkline up={m.up} />
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="tabular text-xs font-bold text-[var(--text-primary)]">${m.price}</span>
              <span className={`tabular text-[11px] font-semibold flex items-center gap-0.5 ${m.up ? 'text-gain' : 'text-loss'}`}>
                {m.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {m.up ? '+' : ''}{m.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* View all link */}
      <a
        href="#"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors duration-150 hover:underline"
        style={{ color: 'var(--accent)' }}
      >
        View full market overview
        <ExternalLink className="h-3 w-3" />
      </a>
    </aside>
  );
}

// ── Pull quote card ──
function PullQuoteCard({ quote, author, tone }: (typeof PULL_QUOTES)[number]): JSX.Element {
  const ts = QUOTE_TONE_STYLES[tone];
  return (
    <figure
      className="flex flex-col gap-4 rounded-2xl border p-6 transition-all duration-150 hover:opacity-90"
      style={{
        background:  ts.bg,
        borderColor: `${ts.border}30`,
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: ts.color + '20', color: ts.color }}
      >
        <Quote className="h-4 w-4" aria-hidden="true" />
      </div>
      <blockquote className="flex-1 text-sm leading-relaxed text-[var(--text-primary)]">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption
        className="border-t pt-3 text-[11px] font-semibold uppercase tracking-widest"
        style={{ borderColor: `${ts.border}20`, color: ts.color }}
      >
        — {author}
      </figcaption>
    </figure>
  );
}

function NewsPage(): JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Head>
        <title>News & Markets · {BRAND}</title>
        <meta name="description" content="Crypto news, market commentary, and on-chain insights from BaneTrading." />
      </Head>

      <AuthenticatedShell>
        <div className="flex flex-col gap-8">

          {/* ── Page header ── */}
          <header className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Editorial
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                  News &amp; Market Commentary
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  Curated coverage of the stories shaping crypto markets — from price action and regulation to protocol upgrades.
                </p>
              </div>
              {/* Refresh button */}
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:self-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </header>

          {/* ── Main content + sidebar ── */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">

            {/* Left: articles */}
            <div className="flex flex-col gap-8 min-w-0">

              {/* Featured */}
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Featured
                </p>
                <FeaturedArticle article={ARTICLES[0]} />
              </section>

              {/* News grid with filter strip */}
              <section key={refreshKey}>
                <NewsGrid
                  articles={ARTICLES.slice(1)}
                  showFeatured={false}
                />
              </section>

              {/* Pull quotes */}
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <p className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Market commentary
                  </p>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {PULL_QUOTES.map((q) => (
                    <PullQuoteCard key={q.author} {...q} />
                  ))}
                </div>
              </section>
            </div>

            {/* Right: sidebar */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
              <MarketSnapshot />

              {/* Newsletter signup */}
              <div
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] p-5"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Weekly digest</p>
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                  Get the week`s top stories and market commentary delivered every Monday.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors duration-150 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    className="w-full rounded-lg py-2 text-xs font-semibold transition-opacity duration-150 hover:opacity-90"
                    style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
                  >
                    Subscribe
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">No spam. Unsubscribe anytime.</p>
              </div>

              {/* Disclaimer */}
              <div
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-3"
                style={{ background: 'var(--bg-muted)' }}
              >
                <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text-secondary)]">Disclaimer: </span>
                  News and commentary on this page are for informational purposes only and do not constitute financial advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(NewsPage);