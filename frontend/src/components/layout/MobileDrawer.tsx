// components/layout/MobileDrawer.tsx
// ── Mobile slide-in drawer (≤ lg). Mirrors the desktop sidebar. ──

import { useEffect } from 'react';
import { X, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { SidebarItem } from './SidebarItem';
import { SIDEBAR_GROUPS } from './sidebarItems';

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || 'PrimeBitTrade';

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps): JSX.Element | null {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const label = user ? (user.displayName || user.name) : 'Guest';

  return (
    <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-overlay backdrop-blur-sm animate-backdrop-in"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'absolute left-0 top-0 h-full w-[280px] bg-sidebar border-r border-border shadow-card',
          'flex flex-col',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 h-16 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-text-inverse font-bold">
              P
            </span>
            <span className="text-sm font-semibold tracking-tight text-text-primary">{BRAND}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-button text-text-muted hover:text-text-primary hover:bg-hover-bg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User card */}
        {user && (
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
            <Avatar src={user.avatarUrl} name={label} size="md" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-text-primary truncate">{label}</div>
              <div className="text-xs text-text-muted truncate">{user.email}</div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-5" aria-label="Main navigation">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.id} className="flex flex-col gap-1">
              <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider text-text-muted">
                {group.title}
              </div>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <SidebarItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      collapsed={false}
                      onNavigate={onClose}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-2 shrink-0">
          <button
            type="button"
            onClick={() => { onClose(); logout(); }}
            className="flex w-full items-center gap-3 rounded-button px-3 h-10 text-sm text-danger hover:bg-hover-bg transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}