// components/layout/TopNav.tsx
// ── Top navigation: 64px sticky, bg=var(--bg-elevated), border-bottom=var(--border) ──

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from './UserMenu';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

export interface TopNavProps {
  onOpenMobileMenu: () => void;
}

export function TopNav({ onOpenMobileMenu }: TopNavProps): JSX.Element {
  const [search, setSearch] = useState('');
  // Notifications: static placeholder count (matches /notifications page)
  const unreadCount = 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-16 bg-elevated border-b border-border',
      )}
    >
      <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-3 px-4 sm:px-6">
        {/* ── Left: hamburger + logo ── */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={onOpenMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-button border border-border bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="inline-flex items-center gap-2 shrink-0">
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-text-inverse font-bold"
            >
              P
            </span>
            <span className="hidden sm:inline text-sm font-semibold tracking-tight text-text-primary">
              {BRAND}
            </span>
          </Link>
        </div>

        {/* ── Center: search ── */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <label className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets, transactions…"
              aria-label="Search"
              className={cn(
                'h-10 w-full rounded-button border border-border bg-muted pl-9 pr-3 text-sm',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-border-strong focus:bg-elevated transition-colors',
              )}
            />
          </label>
        </div>

        {/* ── Right: bell + theme + user ── */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-button border border-border bg-elevated text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-text-inverse"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}