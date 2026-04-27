// components/news/NewsCard.tsx
// ── Standard news card for the grid ──

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { formatDate } from '@/lib/format';
import type { NewsArticle } from '@/types/news';

export interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps): JSX.Element {
  return (
    <Link
      href={article.href}
      className="
        group flex flex-col overflow-hidden rounded-card
        border border-[var(--border)]
        bg-[var(--card)]
        shadow-md
        transition-all duration-200
        hover:border-[var(--primary-muted)]
        hover:shadow-lg
        hover:-translate-y-0.5
      "
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.imageUrl}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* Bottom gradient for pill legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.25) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute left-3 top-3">
          <Pill tone="info" size="xs">{article.category}</Pill>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div className="flex flex-col gap-2">
          {/*
           * Title:
           *   default  → var(--text-primary)
           *   hover    → var(--primary) gold accent
           */}
          <h3
            className="
              text-base font-semibold leading-snug
              text-[var(--text-primary)]
              group-hover:text-[var(--primary)]
              transition-colors duration-200
            "
          >
            {article.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readMinutes} min read
          </span>
        </div>
      </div>
    </Link>
  );
}
