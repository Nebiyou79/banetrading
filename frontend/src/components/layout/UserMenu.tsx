// components/layout/UserMenu.tsx
// ── Avatar dropdown with balance preview + nav links + logout ──

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, User as UserIcon, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/lib/cn';
import { formatUsd } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/hooks/usePortfolio';

export function UserMenu(): JSX.Element | null {
  const { user, logout } = useAuth();
  const { portfolio } = usePortfolio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const label = user.displayName || user.name;
  const balance = portfolio?.totalBalanceUsd ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'group inline-flex items-center gap-2 rounded-button border border-border bg-elevated pl-1 pr-2 h-10 transition-colors',
          'hover:border-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40',
        )}
      >
        <Avatar src={user.avatarUrl} name={label} size="sm" />
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-xs font-medium text-text-primary max-w-[120px] truncate">{label}</span>
          <span className="text-[10px] tabular-nums text-text-muted">{formatUsd(balance)}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-64 rounded-card border border-border bg-elevated shadow-card overflow-hidden"
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatarUrl} name={label} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-text-primary truncate">{label}</div>
                <div className="text-xs text-text-muted truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-input border border-border bg-muted px-3 py-2">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">Balance</span>
              <span className="text-sm font-semibold tabular-nums text-text-primary">{formatUsd(balance)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-text-muted">KYC</span>
              <KycMenuPill status={user.kycStatus} tier={user.kycTier} />
            </div>
          </div>
          <nav className="p-1 text-sm">
            <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            <MenuLink href="/profile" icon={<UserIcon className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Profile
            </MenuLink>
            <MenuLink href="/profile?tab=security" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setOpen(false)}>
              Security
            </MenuLink>
          </nav>
          <div className="border-t border-border p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-sm text-danger hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, children, onClick }: {
  href: string; icon: JSX.Element; children: React.ReactNode; onClick?: () => void;
}): JSX.Element {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2 rounded-button px-3 py-2 text-sm text-text-secondary hover:bg-muted hover:text-text-primary"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function KycMenuPill({ status, tier }: { status: string; tier: number }): JSX.Element {
  if (status === 'approved') return <Pill tone="success" size="xs">Tier {tier} · Verified</Pill>;
  if (status === 'pending')  return <Pill tone="warning" size="xs">Pending</Pill>;
  if (status === 'rejected') return <Pill tone="danger" size="xs">Rejected</Pill>;
  return <Pill tone="neutral" size="xs">Not started</Pill>;
}