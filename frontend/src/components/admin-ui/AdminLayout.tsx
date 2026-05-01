// components/ui/AdminLayout.tsx
// ── Persistent admin layout with sidebar and topbar ──

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/deposits', label: 'Deposits', icon: '💰' },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: '💸' },
  { href: '/admin/kyc', label: 'KYC', icon: '🛡️' },
  { href: '/admin/trades', label: 'Trades', icon: '📈' },
  { href: '/admin/support', label: 'Support', icon: '🎫' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { adminUser, logout } = useAdminAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}
        style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          {sidebarOpen && (
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Admin Panel
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
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
                  isActive ? 'font-semibold' : ''
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                }}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
          >
            {isDark ? '☀️' : '🌙'}
            {sidebarOpen && <span className="ml-2">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between h-16 px-6"
          style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {navItems.find((item) => item.href === router.pathname)?.label || 'Admin'}
          </h1>

          <div className="flex items-center gap-4">
            <span style={{ color: 'var(--text-secondary)' }}>
              {adminUser?.email}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg transition-colors font-medium"
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