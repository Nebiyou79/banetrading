// components/layout/UserMenu.tsx
// ── Avatar dropdown with balance preview + nav links + logout ──

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
  Shield,
  Settings as SettingsIcon,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Clock,
  Globe,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';
import { formatUsd } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { useBalance } from '@/hooks/useBalance';

export function UserMenu(): JSX.Element | null {
  const { user, logout } = useAuth();
  const { balance } = useBalance();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const label = user.displayName || user.name;
  const tier = user.kycTier ?? 1;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'group inline-flex items-center gap-2 rounded-button border border-border bg-elevated pl-1 pr-2 h-10 transition-all duration-200',
          'hover:border-border-strong hover:shadow-sm',
          open && 'border-accent/40 ring-1 ring-accent/20',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        )}
      >
        <Avatar src={user.avatarUrl} name={label} size="sm" />
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-xs font-medium text-text-primary max-w-[120px] truncate">{label}</span>
          <span className="text-[10px] tabular text-text-muted">{formatUsd(balance)}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            className="absolute right-0 top-12 z-50 w-72 rounded-card border border-border bg-elevated shadow-xl overflow-hidden"
          >
            {/* User info card */}
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatarUrl} name={label} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-primary truncate">{label}</div>
                  <div className="text-xs text-text-muted truncate">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-input border border-border bg-muted px-3 py-2">
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">Balance</span>
                <span className="text-sm font-semibold tabular text-text-primary">{formatUsd(balance)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">KYC Tier</span>
                <StatusPill tone={tier >= 3 ? 'success' : tier >= 2 ? 'info' : 'neutral'} size="xs">
                  {`Tier ${tier}`}
                </StatusPill>
              </div>
            </div>

            {/* Quick links */}
            <div className="border-b border-border px-2 py-1.5">
              <div className="grid grid-cols-3 gap-1">
                <QuickLink href="/markets/crypto" icon={<BarChart3 className="h-3.5 w-3.5" />} label="Markets" onClick={() => setOpen(false)} />
                <QuickLink href="/convert" icon={<ArrowLeftRight className="h-3.5 w-3.5" />} label="Convert" onClick={() => setOpen(false)} />
                <QuickLink href="/balance" icon={<Wallet className="h-3.5 w-3.5" />} label="Balance" onClick={() => setOpen(false)} />
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-1 text-sm">
              <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              <MenuLink href="/markets/crypto" icon={<BarChart3 className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Markets
              </MenuLink>
              <MenuLink href="/profile" icon={<UserIcon className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Profile
              </MenuLink>
              <MenuLink href="/profile?tab=security" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Security
              </MenuLink>
              <MenuLink href="/settings" icon={<SettingsIcon className="h-4 w-4" />} onClick={() => setOpen(false)}>
                Settings
              </MenuLink>
              <MenuLink href="/history" icon={<Clock className="h-4 w-4" />} onClick={() => setOpen(false)}>
                History
              </MenuLink>
              {user.role === 'admin' && (
                <MenuLink href="/admin" icon={<Shield className="h-4 w-4" />} onClick={() => setOpen(false)}>
                  Admin Panel
                </MenuLink>
              )}
            </nav>

            {/* Logout */}
            <div className="border-t border-border p-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); logout(); }}
                className="flex w-full items-center gap-2 rounded-button px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Quick link grid item ──
function QuickLink({ href, icon, label, onClick }: {
  href: string;
  icon: JSX.Element;
  label: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-text-muted hover:text-text-primary hover:bg-hover-bg transition-all duration-150"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

// ── Menu link ──
function MenuLink({ href, icon, children, onClick }: {
  href: string;
  icon: JSX.Element;
  children: React.ReactNode;
  onClick?: () => void;
}): JSX.Element {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-button px-3 py-2 text-sm text-text-secondary hover:bg-hover-bg hover:text-text-primary transition-all duration-150"
    >
      <span className="text-text-muted">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}