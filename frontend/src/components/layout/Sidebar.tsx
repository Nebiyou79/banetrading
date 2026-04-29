// components/layout/Sidebar.tsx
// ── Desktop sidebar (≥ lg). Hidden on mobile (drawer used instead). ──

import { useEffect, useState } from 'react';
import { ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tooltip } from '@/components/ui/Tooltip';
import { SidebarItem } from './SidebarItem';
import { SIDEBAR_GROUPS } from './sidebarItems';

const STORAGE_KEY = 'sidebar-collapsed';

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ── Hydrate from localStorage ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    setHydrated(true);
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
      aria-label="Primary"
      className={cn(
        'sticky top-16 hidden lg:flex shrink-0 flex-col bg-sidebar border-r border-border',
        // Full height minus topnav
        'h-[calc(100vh-4rem)]',
        // Smooth width animation
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-60',
        // Avoid flicker before hydration
        !hydrated && 'invisible',
        className,
      )}
    >
      <nav
        className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden px-2 pt-4 pb-2"
        aria-label="Main navigation"
      >
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            {!collapsed && (
              <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider text-text-muted">
                {group.title}
              </div>
            )}
            {collapsed && (
              <div className="mx-3 my-1 h-px bg-border" aria-hidden="true" />
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarItem
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    collapsed={collapsed}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle (pinned bottom) ── */}
      <div className="border-t border-border p-2">
        {collapsed ? (
          <Tooltip label="Expand sidebar" side="right">
            <button
              type="button"
              onClick={toggle}
              aria-label="Expand sidebar"
              className="flex w-full items-center justify-center h-9 rounded-button text-text-muted hover:text-text-primary hover:bg-hover-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <ChevronsLeft className="h-4 w-4 rotate-180" />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="flex w-full items-center gap-2 rounded-button px-3 h-9 text-xs text-text-muted hover:text-text-primary hover:bg-hover-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span>Collapse</span>
          </button>
        )}
      </div>
    </aside>
  );
}