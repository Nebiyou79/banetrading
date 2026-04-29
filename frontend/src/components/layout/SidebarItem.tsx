// components/layout/SidebarItem.tsx
// ── Single sidebar nav row ──

import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Tooltip } from '@/components/ui/Tooltip';

export interface SidebarItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  collapsed: boolean;
  onNavigate?: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarItem({ href, label, icon, collapsed, onNavigate }: SidebarItemProps): JSX.Element {
  const router = useRouter();
  const active = isActive(router.pathname, href);

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        // Frame
        'group relative flex items-center h-10 rounded-button transition-colors',
        // Active state — bg + 3px accent left border + primary text
        active && 'bg-sidebar-active-bg text-text-primary',
        active && 'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-sidebar-active-border',
        // Inactive state
        !active && 'text-text-secondary hover:bg-hover-bg hover:text-text-primary',
        // Padding scales with collapsed
        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
        // Subtle focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
      )}
    >
      <span className={cn('inline-flex shrink-0', active && 'text-text-primary')}>{icon}</span>
      {!collapsed && (
        <span className="truncate text-sm font-medium">{label}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return <Tooltip label={label} side="right">{link}</Tooltip>;
  }
  return link;
}