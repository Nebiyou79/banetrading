'use client';
// components/layout/Sidebar.tsx

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useSupport } from '@/hooks/useSupport';
import colors from '@/styles/colors';
import { Badge } from '@/components/ui/Badge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  adminOnly?: boolean;
}

const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  ),
  trade: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  history: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M3.05 11a9 9 0 1018 0 9 9 0 00-18 0" />
    </svg>
  ),
  deposit: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" />
    </svg>
  ),
  withdraw: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4M4 12l8-8 8 8" />
    </svg>
  ),
  kyc: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5M10 6V4a2 2 0 114 0v2M10 6h4" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  support: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  admin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const Logo = () => (
  <div className="flex items-center gap-2.5 px-5 py-4">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
      style={{ background: colors.gradient.bluePrimary, color: '#fff' }}
    >
      N
    </div>
    <span className="font-bold text-base tracking-tight" style={{ color: colors.dark.text }}>
      Neba<span style={{ color: colors.primary[500] }}>trading</span>
    </span>
  </div>
);

interface SidebarContentProps {
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();
  const { unreadCount } = useSupport(0); // no polling in sidebar

  const kycBadge =
    user && user.kycTier === 0 ? (
      <Badge variant="warning" size="sm">Verify</Badge>
    ) : null;

  const supportBadge =
    unreadCount > 0 ? (
      <span
        className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
        style={{ backgroundColor: colors.danger, color: '#fff' }}
      >
        {unreadCount}
      </span>
    ) : null;

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Overview', icon: icons.dashboard },
    { href: '/dashboard/trade', label: 'Trade', icon: icons.trade },
    { href: '/dashboard/history', label: 'History', icon: icons.history },
    { href: '/dashboard/deposit', label: 'Deposit', icon: icons.deposit },
    { href: '/dashboard/withdraw', label: 'Withdraw', icon: icons.withdraw },
    { href: '/dashboard/kyc', label: 'Verification', icon: icons.kyc, badge: kycBadge },
    { href: '/dashboard/profile', label: 'Profile', icon: icons.profile },
    { href: '/dashboard/support', label: 'Support', icon: icons.support, badge: supportBadge },
  ];

  if (user?.role === 'admin') {
    navItems.push({ href: '/admin', label: 'Admin Panel', icon: icons.admin, adminOnly: true });
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: colors.sidebar.bg }}
    >
      <Logo />

      {/* Divider */}
      <div className="mx-4 border-b mb-2" style={{ borderColor: colors.dark.border }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
              style={{
                backgroundColor: isActive ? colors.sidebar.activeBg : 'transparent',
                color: isActive ? colors.sidebar.activeText : colors.sidebar.text,
                borderLeft: isActive ? `3px solid ${colors.sidebar.activeBorder}` : '3px solid transparent',
              }}
            >
              <span
                style={{ color: isActive ? colors.sidebar.activeIcon : colors.sidebar.icon }}
                className="shrink-0"
              >
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && <span>{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t" style={{ borderColor: colors.dark.border }}>
        {user && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1"
            style={{ backgroundColor: colors.dark.surface }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: colors.gradient.bluePrimary, color: '#fff' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: colors.dark.text }}>
                {user.name}
              </p>
              <p className="text-[10px] truncate" style={{ color: colors.dark.textMuted }}>
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: colors.dark.textMuted }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = colors.danger)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = colors.dark.textMuted)}
        >
          {icons.logout}
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => (
  <aside
    className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r"
    style={{ borderColor: colors.dark.border }}
  >
    <SidebarContent />
  </aside>
);

export const MobileSidebar: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <aside
        className="absolute left-0 top-0 h-full w-60 border-r"
        style={{ borderColor: colors.dark.border }}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </div>
  );
};

export default Sidebar;
