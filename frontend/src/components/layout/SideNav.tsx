// components/layout/SideNav.tsx
// ── Desktop-only collapsible side navigation ──

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Globe,
  ArrowLeftRight,
  Newspaper,
  User as UserIcon,
  ShieldCheck,
  LifeBuoy,
  Wallet,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface SideNavItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

const ITEMS: SideNavItem[] = [
  { label: 'Dashboard', href: '/dashboard',         icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Markets',   href: '/markets/crypto',     icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Trade',     href: '/trade',               icon: <TrendingUp className="h-4 w-4" /> },
  { label: 'Convert',   href: '/convert',             icon: <ArrowLeftRight className="h-4 w-4" /> },
  { label: 'Balance',   href: '/balance',             icon: <Wallet className="h-4 w-4" /> },
  { label: 'History',   href: '/history',             icon: <Clock className="h-4 w-4" /> },
  { label: 'News',      href: '/news',                icon: <Newspaper className="h-4 w-4" /> },
  { label: 'Profile',   href: '/profile',             icon: <UserIcon className="h-4 w-4" /> },
  { label: 'Security',  href: '/profile?tab=security',icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Support',   href: '/support',             icon: <LifeBuoy className="h-4 w-4" /> },
];

const STORAGE_KEY = 'pbt_side_collapsed';

function isActive(router: ReturnType<typeof useRouter>, href: string): boolean {
  const path = href.split('?')[0];
  if (path === '/') return router.pathname === '/';
  return router.pathname === path || router.pathname.startsWith(`${path}/`);
}

export function SideNav(): JSX.Element {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(stored === '1');
    setMounted(true);
  }, []);

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
        'hidden lg:flex flex-col border-r border-border bg-elevated/60 transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[220px]',
        !mounted && 'invisible',
      )}
    >
      <nav className="flex flex-1 flex-col gap-0.5 p-2 pt-4 overflow-hidden">
        {ITEMS.map((item, i) => {
          const active = isActive(router, item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-button px-3 h-10 text-sm transition-all duration-200',
                  active
                    ? 'bg-muted text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted/60 hover:translate-x-0.5',
                  collapsed && 'justify-center px-0',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                )}
              >
                <span className="inline-flex shrink-0">{item.icon}</span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'group flex w-full items-center gap-2 rounded-button px-3 h-9 text-xs text-text-muted hover:text-text-primary hover:bg-muted/60 transition-all duration-200',
            collapsed && 'justify-center px-0',
          )}
        >
          <ChevronLeft className={cn(
            'h-4 w-4 transition-all duration-300',
            collapsed && 'rotate-180',
            'group-hover:-translate-x-0.5',
          )} />
          {!collapsed && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}