// components/layout/TopNav.tsx
// ── Top navigation: 64px sticky, bg=var(--bg-elevated), border-bottom=var(--border) ──

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Menu, Search, Bell, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from './UserMenu';

const BRAND = 'BaneTrading';

export interface TopNavProps {
  onOpenMobileMenu: () => void;
}

export function TopNav({ onOpenMobileMenu }: TopNavProps): JSX.Element {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const unreadCount = 0;

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (search.trim()) {
        router.push(`/markets/crypto?search=${encodeURIComponent(search.trim())}`);
        setSearch('');
      }
    },
    [search, router],
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-16 bg-elevated border-b border-border',
        'backdrop-blur-xl bg-opacity-95',
      )}
    >
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* ── Left: hamburger + logo ── */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={onOpenMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-button border border-border bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-all duration-200 active:scale-95 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/assets/logo.jpg"
                alt={BRAND}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
            <span className="hidden md:block text-sm font-extrabold tracking-tight text-text-primary group-hover:text-accent transition-colors">
              {BRAND}
            </span>
          </Link>
        </div>

        {/* ── Center: search ── */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <label className="relative w-full">
            <Search
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
                searchFocused ? 'text-accent' : 'text-text-muted',
              )}
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search markets, transactions…"
              aria-label="Search"
              className={cn(
                'h-10 w-full rounded-button border px-9 text-sm transition-all duration-200',
                'bg-muted text-text-primary placeholder:text-text-muted',
                searchFocused
                  ? 'border-accent bg-elevated shadow-sm ring-1 ring-accent/20'
                  : 'border-border',
              )}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200',
                search.trim()
                  ? 'bg-accent text-text-inverse opacity-100'
                  : 'bg-transparent text-text-muted opacity-0 pointer-events-none',
              )}
            >
              Go
            </button>
          </label>
        </form>

        {/* ── Right: bell + theme + user ── */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/markets/crypto"
            className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-button border border-border bg-elevated px-3 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-all duration-200"
          >
            <BarChartIcon className="h-3.5 w-3.5" />
            <span>Markets</span>
          </Link>

          <Link
            href="/notifications"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-button border border-border bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-all duration-200 active:scale-95"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-text-inverse"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </Link>

          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

// ── Small bar chart icon for the Markets quick link ──
function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13V7" />
      <path d="M7 13V3" />
      <path d="M11 13V5" />
      <path d="M15 13V9" />
    </svg>
  );
}