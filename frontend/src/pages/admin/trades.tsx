// pages/admin/trades.tsx
// ── Admin trades page (read-only) ──

'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import DataTable from '@/components/admin-ui/DataTable';
import Badge from '@/components/admin-ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import adminService from '@/services/adminService';
import type { Trade } from '@/types';

const TRADES_KEY = ['admin', 'trades'];

export default function TradesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <TradesContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function TradesContent() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useAdminData<{ trades: Trade[]; total: number }>(
    [...TRADES_KEY, { page }],
    () => adminService.fetchAllTrades({ skip: page * 20, limit: 20 }),
  );

  const columns = [
    {
      key: '_id',
      header: 'ID',
      render: (t: Trade) => <span className="font-mono text-xs">{t._id?.slice(-8)}</span>,
    },
    {
      key: 'user',
      header: 'User',
      render: (t: Trade) => (t.user as any)?.email || t.user || '-',
    },
    { key: 'pairDisplay', header: 'Pair' },
    {
      key: 'direction',
      header: 'Dir.',
      render: (t: Trade) => (
        <Badge variant={(t as any).direction === 'buy' ? 'success' : 'danger'}>
          {(t as any).direction || '-'}
        </Badge>
      ),
    },
    { key: 'stake', header: 'Stake', render: (t: Trade) => (t as any).stake?.toFixed(4) || '-' },
    { key: 'planKey', header: 'Plan' },
    {
      key: 'entryPrice',
      header: 'Entry',
      render: (t: Trade) => (t as any).entryPrice?.toFixed(4) || '-',
    },
    {
      key: 'exitPrice',
      header: 'Exit',
      render: (t: Trade) => (t as any).exitPrice?.toFixed(4) || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Trade) => {
        const status = (t as any).status || 'pending';
        const variant = status === 'won' ? 'success' : status === 'lost' ? 'danger' : 'warning';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      key: 'payout',
      header: 'Payout',
      render: (t: Trade) => {
        const payout = (t as any).payout;
        return (
          <span className={payout > 0 ? 'text-gain' : payout < 0 ? 'text-loss' : ''}>
            {payout?.toFixed(4) || '-'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (t: Trade) => t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Trades</h2>
      <DataTable columns={columns} data={data?.trades || []} isLoading={isLoading} />

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page {page + 1} of {Math.ceil(data.total / 20)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * 20 >= data.total}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}