// types/news.ts
// ── News article types (static content for now) ──

export type NewsCategory = 'Bitcoin' | 'Ethereum' | 'DeFi' | 'Regulation' | 'Altcoins' | 'Markets' | 'Stablecoins';

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: NewsCategory;
  publishedAt: string;       // ISO date
  readMinutes: number;
  href: string;              // placeholder link
}