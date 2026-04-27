// components/news/NewsGrid.tsx
// ── Responsive grid of NewsCards ──

import { NewsCard } from './NewsCard';
import type { NewsArticle } from '@/types/news';

export interface NewsGridProps {
  articles: NewsArticle[];
}

export function NewsGrid({ articles }: NewsGridProps): JSX.Element {
  if (articles.length === 0) {
    return (
      <div
        className="
          flex items-center justify-center rounded-card
          border border-dashed border-[var(--border)]
          bg-[var(--surface)]
          p-12 text-sm text-[var(--text-muted)]
        "
      >
        No articles available right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
