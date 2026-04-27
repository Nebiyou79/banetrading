// components/layout/TopNav.tsx
// ── Top navigation for the authenticated shell ──

import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from './UserMenu';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade Clone';

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Trade',     href: '/trade' },     // TODO: future trading module
  { label: 'Markets',   href: '/markets' },   // TODO: future markets module
  { label: 'News',      href: '/news' },
  { label: 'Support',   href: '/support' },   // TODO: future support module
];

export interface TopNavProps {
  onOpenMobileMenu: () => void;
}

function isItemActive(router: ReturnType<typeof useRouter>, href: string): boolean {
  if (href === '/') return router.pathname === '/';
  return router.pathname === href || router.pathname.startsWith(`${href}/`);
}

export function TopNav({ onOpenMobileMenu }: TopNavProps): JSX.Element {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-elevated/90 backdrop-blur supports-[backdrop-filter]:bg-elevated/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left — hamburger (mobile) + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={onOpenMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-button border border-border bg-elevated text-text-secondary hover:text-text-primary hover:border-text-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#0B0E11] font-bold">
              P
            </span>
            <span className="hidden sm:inline text-sm font-semibold tracking-tight text-text-primary">
              {BRAND}
            </span>
          </Link>
        </div>

        {/* Center — primary nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY_NAV.map((item) => {
            const active = isItemActive(router, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative inline-flex items-center h-9 rounded-button px-3 text-sm font-medium transition-colors',
                  active
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[17px] left-3 right-3 h-[2px] bg-accent rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right — theme toggle + user menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}