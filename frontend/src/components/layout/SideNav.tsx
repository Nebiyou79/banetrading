// components/layout/SideNav.tsx
// ── Desktop-only collapsible side navigation ──

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChevronLeft,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Newspaper,
  User as UserIcon,
  ShieldCheck,
  LifeBuoy,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface SideNavItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

const ITEMS: SideNavItem[] = [
  { label: 'Dashboard', href: '/dashboard',               icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Balance',   href: '/balance',                 icon: <Wallet className="h-4 w-4" /> },          // TODO: Document 3
  { label: 'Trade',     href: '/trade',                   icon: <TrendingUp className="h-4 w-4" /> },      // TODO: trading module
  { label: 'Markets',   href: '/markets',                 icon: <BarChart3 className="h-4 w-4" /> },       // TODO: markets module
  { label: 'News',      href: '/news',                    icon: <Newspaper className="h-4 w-4" /> },
  { label: 'Profile',   href: '/profile',                 icon: <UserIcon className="h-4 w-4" /> },
  { label: 'Security',  href: '/profile?tab=security',    icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Support',   href: '/support',                 icon: <LifeBuoy className="h-4 w-4" /> },        // TODO: support module
];

const STORAGE_KEY = 'pbt_side_collapsed';

function isActive(router: ReturnType<typeof useRouter>, href: string): boolean {
  const path = href.split('?')[0];
  if (path === '/') return router.pathname === '/';
  return router.pathname === path;
}

export function SideNav(): JSX.Element {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === '1';
  });

  const toggle = (): void => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-elevated/60 transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-[220px]',
      )}
    >
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-4">
        {ITEMS.map((item) => {
          const active = isActive(router, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-button px-3 h-10 text-sm transition-colors',
                active
                  ? 'bg-muted text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-muted/60',
                collapsed && 'justify-center px-0',
              )}
            >
              <span className="inline-flex shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-2 rounded-button px-3 h-9 text-xs text-text-muted hover:text-text-primary hover:bg-muted/60',
            collapsed && 'justify-center px-0',
          )}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}