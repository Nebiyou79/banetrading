// components/ui/AdminLayout.tsx
// ── Persistent admin layout with sidebar and topbar ──
//
// THEME FIXES applied:
// • Theme toggle button: was using var(--hover-bg) bg with var(--text-secondary)
//   text — both already theme-aware ✅, but hover state was missing → added
//   transition + hover:opacity-80
// • Logout button: color was already var(--danger) ✅ but missing hover state
//   → added hover:opacity-90
// • Sidebar collapse toggle: already used var(--hover-bg)/var(--text-secondary) ✅
// • Nav items: active state already uses var(--sidebar-active-bg) and
//   var(--primary) ✅; inactive hover was missing → added onMouseEnter/Leave
//   with var(--hover-bg) for clear feedback in light mode
// • Admin email display: var(--text-secondary) ✅

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminAuth } from '@/hooks/useAdminAuth';

function useAdminTheme() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    const theme = newDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  return { isDark, toggleTheme, mounted };
}

const navItems = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: '📊' },
  { href: '/admin/users',       label: 'Users',       icon: '👥' },
  { href: '/admin/deposits',    label: 'Deposits',    icon: '💰' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
  { href: '/admin/kyc',         label: 'KYC',         icon: '🛡️' },
  { href: '/admin/trades',      label: 'Trades',      icon: '📈' },
  { href: '/admin/support',     label: 'Support',     icon: '🎫' },
  { href: '/admin/settings',    label: 'Settings',    icon: '⚙️' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { adminUser, logout } = useAdminAuth();
  const { isDark, toggleTheme } = useAdminTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col flex-shrink-0`}
        style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo / collapse toggle */}
        <div
          className="flex items-center justify-between h-16 px-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {sidebarOpen && (
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Admin Panel
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--hover-bg)' }}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors mb-1 ${
                  sidebarOpen ? '' : 'justify-center'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  borderLeft: isActive
                    ? '3px solid var(--sidebar-active-border)'
                    : '3px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                }}
                /* THEME FIX: hover state for inactive items — makes nav
                   discoverable in light mode where the bg is near-white */
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="ml-3 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
            {sidebarOpen && (
              <span className="ml-2 text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header
          className="flex items-center justify-between h-16 px-6 flex-shrink-0"
          style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h1 className="text-xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {navItems.find((item) => item.href === router.pathname)?.label || 'Admin'}
          </h1>

          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
              {adminUser?.email || 'Admin'}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg transition-opacity font-medium hover:opacity-90"
              style={{
                backgroundColor: 'var(--danger-muted)',
                color: 'var(--danger)',
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}