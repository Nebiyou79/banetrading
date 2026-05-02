// pages/admin/dashboard.tsx
// ── Admin dashboard with stats cards ──

'use client';

import React from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import StatCard from '@/components/admin-ui/StatCard';
import { useAdminData } from '@/hooks/useAdminData';
import adminService from '@/services/adminService';
import type { AdminStats } from '@/types';

// Default fallback stats matching AdminStats interface
const DEFAULT_STATS: AdminStats = {
  totalUsers: 0,
  totalDeposits: 0,
  pendingDeposits: 0,
  totalWithdrawals: 0,
  pendingWithdrawals: 0,
  totalTrades: 0,
  openTickets: 0,
};

export default function AdminDashboardPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <DashboardContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function DashboardContent() {
  const { data, isLoading } = useAdminData<AdminStats>(
    ['admin', 'stats'],
    () => adminService.getStats(),
  );

  // Use default stats when data is null/undefined
  const stats = data || DEFAULT_STATS;

  // Ensure all values are numbers
  const pendingDepositsValue = typeof stats.pendingDeposits === 'number' 
    ? stats.pendingDeposits 
    : (stats.pendingDeposits as any)?.count || 0;
    
  const pendingWithdrawalsValue = typeof stats.pendingWithdrawals === 'number'
    ? stats.pendingWithdrawals
    : (stats.pendingWithdrawals as any)?.count || 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard 
          icon="👥" 
          title="Total Users" 
          value={stats.totalUsers} 
          color="var(--primary)" 
        />
        <StatCard 
          icon="💰" 
          title="Total Deposits" 
          value={stats.totalDeposits} 
          color="var(--info)" 
        />
        <StatCard 
          icon="⏳" 
          title="Pending Deposits" 
          value={pendingDepositsValue} 
          color="var(--warning)" 
        />
        <StatCard 
          icon="💸" 
          title="Total Withdrawals" 
          value={stats.totalWithdrawals} 
          color="var(--info)" 
        />
        <StatCard 
          icon="⏳" 
          title="Pending Withdrawals" 
          value={pendingWithdrawalsValue} 
          color="var(--warning)" 
        />
        <StatCard 
          icon="📈" 
          title="Total Trades" 
          value={stats.totalTrades} 
          color="var(--success)" 
        />
        <StatCard 
          icon="🎫" 
          title="Open Tickets" 
          value={stats.openTickets} 
          color="var(--danger)" 
        />
      </div>
    </div>
  );
}