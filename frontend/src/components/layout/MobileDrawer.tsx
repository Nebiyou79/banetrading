// components/layout/MobileDrawer.tsx
// ── Slide-in mobile drawer with primary nav ──

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { X, LogOut, LayoutDashboard, TrendingUp, BarChart3, Newspaper, LifeBuoy, User as UserIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { formatUsd } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/hooks/usePortfolio';

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DrawerItem {
  label: string;
  href: string;
  icon: JSX.Element;
}

const PRIMARY: DrawerItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Trade',     href: '/trade',     icon: <TrendingUp className="h-4 w-4" /> },
  { label: 'Markets',   href: '/markets',   icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'News',      href: '/news',      icon: <Newspaper className="h-4 w-4" /> },
  { label: 'Support',   href: '/support',   icon: <LifeBuoy className="h-4 w-4" /> },
];

const SECONDARY: DrawerItem[] = [
  { label: 'Profile',  href: '/profile',                    icon: <UserIcon className="h-4 w-4" /> },
  { label: 'Security', href: '/profile?tab=security',       icon: <ShieldCheck className="h-4 w-4" /> },
];

function isActive(router: ReturnType<typeof useRouter>, href: string): boolean {
  const path = href.split('?')[0];
  if (path === '/') return router.pathname === '/';
  return router.pathname === path;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps): JSX.Element | null {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { portfolio } = usePortfolio();

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const label = user ? (user.displayName || user.name) : 'Guest';

  return (
    <div className="fixed inset-0 z-[90] lg:hidden" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'absolute left-0 top-0 h-full w-[86%] max-w-[340px] bg-base border-r border-border shadow-card',
          'flex flex-col',
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={user?.avatarUrl} name={label} size="md" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary truncate">{label}</div>
              {user?.email && <div className="text-xs text-text-muted truncate">{user.email}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between rounded-input border border-border bg-elevated px-3 py-2">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Balance</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {formatUsd(portfolio?.totalBalanceUsd ?? 0)}
            </span>
          </div>
          {user && (
            <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-text-muted">
              <span>KYC</span>
              <KycDrawerPill status={user.kycStatus} tier={user.kycTier} />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-auto p-2">
          <Section title="Navigate">
            {PRIMARY.map((item) => (
              <DrawerLink key={item.href} item={item} active={isActive(router, item.href)} onNav={onClose} />
            ))}
          </Section>
          <Section title="Account">
            {SECONDARY.map((item) => (
              <DrawerLink key={item.href} item={item} active={isActive(router, item.href)} onNav={onClose} />
            ))}
          </Section>
        </nav>

        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={() => { onClose(); logout(); }}
            className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm text-danger hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="mb-2">
      <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-text-muted">{title}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function DrawerLink({ item, active, onNav }: { item: DrawerItem; active: boolean; onNav: () => void }): JSX.Element {
  return (
    <Link
      href={item.href}
      onClick={onNav}
      className={cn(
        'flex items-center gap-3 rounded-button px-3 py-2.5 text-sm transition-colors',
        active
          ? 'bg-muted text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-muted/60',
      )}
    >
      <span className="inline-flex">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function KycDrawerPill({ status, tier }: { status: string; tier: number }): JSX.Element {
  if (status === 'approved') return <Pill tone="success" size="xs">Tier {tier} · Verified</Pill>;
  if (status === 'pending')  return <Pill tone="warning" size="xs">Pending</Pill>;
  if (status === 'rejected') return <Pill tone="danger" size="xs">Rejected</Pill>;
  return <Pill tone="neutral" size="xs">Not started</Pill>;
}