'use client';
// components/layout/DashboardLayout.tsx

import React, { useState } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Navbar } from './Navbar';
import colors from '@/styles/colors';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: colors.dark.bg }}
    >
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ backgroundColor: colors.dark.bg }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
