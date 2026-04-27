// components/news/FeaturedArticle.tsx
// ── Full-width featured news card ──

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { formatDate } from '@/lib/format';
import type { NewsArticle } from '@/types/news';

export interface FeaturedArticleProps {
  article: NewsArticle;
}

export function FeaturedArticle({ article }: FeaturedArticleProps): JSX.Element {
  return (
    <Link
      href={article.href}
      className="
        group block overflow-hidden rounded-card
        border border-[var(--border)]
        bg-[var(--card)]
        shadow-lg
        transition-all duration-200
        hover:border-[var(--primary-muted)]
        hover:shadow-xl
      "
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Thumbnail */}
        <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[320px] overflow-hidden bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {/*
           * Gradient overlay — fades image into card bg on the right edge (desktop)
           * Uses --background for seamless blend
           */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                'linear-gradient(to right, transparent 60%, var(--card) 100%)',
            }}
            aria-hidden="true"
          />
          {/* Featured pill */}
          <div className="absolute left-4 top-4">
            <Pill tone="accent">Featured</Pill>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between gap-4 p-6 lg:p-8">
          <div className="flex flex-col gap-3">
            {/* Meta row */}
            <div className="flex items-center gap-2">
              <Pill tone="info" size="xs">{article.category}</Pill>
              <span className="text-[11px] text-[var(--text-muted)]">
                {formatDate(article.publishedAt)}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight">
              {article.title}
            </h2>

            {/* Excerpt */}
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              {article.excerpt}
            </p>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Clock className="h-3.5 w-3.5" />
              {article.readMinutes} min read
            </span>

            {/*
             * CTA link:
             *   text-[var(--primary)] → gold accent
             *   gap widens on hover via group-hover transition
             */}
            <span
              className="
                inline-flex items-center gap-1.5 text-sm font-medium
                text-[var(--primary)]
                group-hover:gap-2.5
                transition-all duration-200
              "
            >
              Read more
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
