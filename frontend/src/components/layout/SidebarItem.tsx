// components/layout/SidebarItem.tsx
// ── Single sidebar nav row with stagger animation ──

import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Tooltip } from '@/components/ui/Tooltip';

export interface SidebarItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  collapsed: boolean;
  onNavigate?: () => void;
  index?: number;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  // Match exact path or path with query params (e.g., /markets/forex?type=metals)
  if (href.includes('?')) {
    return pathname === href.split('?')[0];
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarItem({ href, label, icon, collapsed, onNavigate, index = 0 }: SidebarItemProps): JSX.Element {
  const router = useRouter();
  const active = isActive(router.pathname, href);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 50);
    return () => clearTimeout(timer);
  }, [index]);

  const link = (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={mounted ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          // Frame
          'group relative flex items-center h-10 rounded-button transition-all duration-200',
          // Active state — bg + 3px accent left border + primary text + subtle glow
          active && 'bg-sidebar-active-bg text-text-primary shadow-sm',
          active && 'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full before:bg-sidebar-active-border before:animate-[slideIn_0.2s_ease-out]',
          // Inactive state
          !active && 'text-text-secondary hover:bg-hover-bg hover:text-text-primary hover:translate-x-0.5',
          // Padding scales with collapsed
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          // Focus ring
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          // Overflow hidden for animation containment
          'overflow-hidden',
        )}
      >
        {/* Active indicator glow */}
        {active && (
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 bg-sidebar-active-bg rounded-button"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            aria-hidden="true"
          />
        )}

        <span className={cn(
          'relative z-10 inline-flex shrink-0 transition-colors duration-200',
          active && 'text-sidebar-active-border',
        )}>
          {icon}
        </span>

        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 truncate text-sm font-medium"
          >
            {label}
          </motion.span>
        )}
      </Link>
    </motion.div>
  );

  if (collapsed) {
    return <Tooltip label={label} side="right">{link}</Tooltip>;
  }
  return link;
}