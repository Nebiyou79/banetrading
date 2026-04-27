// pages/news.tsx
// ── Static news / editorial page ──

import Head from 'next/head';
import { Quote } from 'lucide-react';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import { withAuth } from '@/components/layout/withAuth';
import { FeaturedArticle } from '@/components/news/FeaturedArticle';
import { NewsGrid } from '@/components/news/NewsGrid';
import type { NewsArticle } from '@/types/news';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

// ── Static content (replace later with CMS feed) ──
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
    title: 'Ethereum&apos;s next upgrade roadmap',
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
    category: 'Stablecoins',
    publishedAt: '2026-04-21T15:00:00Z',
    readMinutes: 4,
    href: '#',
  },
  {
    id: 'a-3',
    title: 'Solana DeFi TVL surges 40%',
    excerpt:
      'Solana&apos;s on-chain DeFi total value locked climbed 40% over the past month as new protocols and bridge inflows captured user attention.',
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

const PULL_QUOTES = [
  {
    quote: 'Liquidity is the only narrative that matters in the short term — flows lead price.',
    author: 'Macro desk note',
  },
  {
    quote: 'Spot ETFs have become the cleanest read of institutional appetite for crypto exposure.',
    author: 'Research weekly',
  },
  {
    quote: 'Stablecoin supply is the closest thing crypto has to a leading indicator.',
    author: 'On-chain commentary',
  },
];

function NewsPage(): JSX.Element {
  const [featured, ...rest] = ARTICLES;

  return (
    <>
      <Head><title>News · {BRAND}</title></Head>
      <AuthenticatedShell>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Editorial</span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              Crypto News &amp; Market Commentary
            </h1>
            <p className="text-sm text-text-secondary max-w-2xl">
              Curated coverage of the stories shaping crypto markets — from price action and regulation to protocol upgrades.
            </p>
          </header>

          <FeaturedArticle article={featured} />

          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold text-text-primary">Latest stories</h2>
            <NewsGrid articles={rest} />
          </div>

          {/* ── Market commentary pull-quotes ── */}
          <section className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold text-text-primary">Market commentary</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PULL_QUOTES.map((q, i) => (
                <figure
                  key={i}
                  className="rounded-card border border-border bg-elevated p-6 shadow-card"
                >
                  <Quote className="h-5 w-5 text-accent" aria-hidden="true" />
                  <blockquote className="mt-3 text-sm text-text-primary leading-relaxed">
                    &ldquo;{q.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 text-[11px] uppercase tracking-wider text-text-muted">
                    — {q.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </AuthenticatedShell>
    </>
  );
}

export default withAuth(NewsPage);