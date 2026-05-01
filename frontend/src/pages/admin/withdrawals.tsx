// pages/admin/withdrawals.tsx
// ── Admin withdrawals management page ──

'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import DataTable from '@/components/admin-ui/DataTable';
import Modal from '@/components/admin-ui/Modal';
import SearchInput from '@/components/admin-ui/SearchInput';
import Badge from '@/components/admin-ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import adminService from '@/services/adminService';
import type { Withdrawal } from '@/types/';

const WITHDRAWALS_KEY = ['admin', 'withdrawals'];

export default function WithdrawalsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <WithdrawalsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function WithdrawalsContent() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Withdrawal | null>(null);

  const { data, isLoading } = useAdminData<{ withdrawals: Withdrawal[]; total: number }>(
    [...WITHDRAWALS_KEY, { statusFilter, search }],
    () => adminService.fetchWithdrawals({ status: statusFilter || undefined, search: search || undefined }),
  );

  const approveMutation = useAdminMutation(
    (id: string) => adminService.approveWithdrawal(id),
    { invalidateKeys: [WITHDRAWALS_KEY] },
  );

  const rejectMutation = useAdminMutation(
    ({ id, reason }: { id: string; reason: string }) => adminService.rejectWithdrawal(id, reason),
    { invalidateKeys: [WITHDRAWALS_KEY] },
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="danger">Rejected</Badge>;
      default: return <Badge variant="warning">Pending</Badge>;
    }
  };

  const columns = [
    {
      key: 'userId',
      header: 'User',
      render: (w: Withdrawal) => <span className="font-medium">{(w as any).userId?.email || w.userId}</span>,
    },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'network', header: 'Network' },
    { key: 'toAddress', header: 'To Address', render: (w: Withdrawal) => (w as any).toAddress?.slice(0, 10) + '...' || '-' },
    { key: 'status', header: 'Status', render: (w: Withdrawal) => getStatusBadge(w.status) },
    {
      key: 'createdAt',
      header: 'Date',
      render: (w: Withdrawal) => w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (w: Withdrawal) => (
        <button
          onClick={() => setSelected(w)}
          className="px-3 py-1 rounded text-sm font-medium"
          style={{ backgroundColor: 'var(--info-muted)', color: 'var(--info)' }}
        >
          Review
        </button>
      ),
    },
  ];

  const statusTabs = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Withdrawals</h2>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by user..." />
      </div>

      <div className="mb-4 flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === tab.key ? 'var(--primary)' : 'var(--card)',
              color: statusFilter === tab.key ? 'var(--text-inverse)' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={data?.withdrawals || []} isLoading={isLoading} />

      {/* Review Modal (reuses same pattern as deposits with slight differences) */}
      <WithdrawalReviewModal
        withdrawal={selected}
        onClose={() => setSelected(null)}
        onApprove={(id) => approveMutation.mutateAsync(id).then(() => setSelected(null))}
        onReject={(id, reason) => rejectMutation.mutateAsync({ id, reason }).then(() => setSelected(null))}
        isLoading={approveMutation.isLoading || rejectMutation.isLoading}
      />
    </div>
  );
}

function WithdrawalReviewModal({
  withdrawal,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: {
  withdrawal: Withdrawal | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string, reason: string) => Promise<any>;
  isLoading: boolean;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!withdrawal) return null;

  return (
    <Modal isOpen={!!withdrawal} onClose={onClose} title="Review Withdrawal">
      <div className="space-y-3" style={{ color: 'var(--text-primary)' }}>
        <p><strong>User:</strong> {(withdrawal as any).userId?.email || withdrawal.userId}</p>
        <p><strong>Amount:</strong> {withdrawal.amount} {withdrawal.currency}</p>
        <p><strong>Network:</strong> {withdrawal.network}</p>
        <p><strong>To Address:</strong> {(withdrawal as any).toAddress}</p>
        <p><strong>Network Fee:</strong> {(withdrawal as any).networkFee || 0}</p>
        <p><strong>Status:</strong> {withdrawal.status}</p>

        {withdrawal.status === 'pending' && (
          <div className="pt-4">
            {showRejectInput && (
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason..."
                className="w-full px-3 py-2 rounded-lg mb-3"
                style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                rows={3}
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(withdrawal._id)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg flex-1"
                style={{ backgroundColor: 'var(--success)', color: 'white' }}
              >
                Approve
              </button>
              {!showRejectInput ? (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="px-4 py-2 rounded-lg flex-1"
                  style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                >
                  Reject
                </button>
              ) : (
                <button
                  onClick={() => onReject(withdrawal._id, rejectReason)}
                  disabled={!rejectReason.trim() || isLoading}
                  className="px-4 py-2 rounded-lg flex-1 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--danger)', color: 'white' }}
                >
                  Confirm Reject
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}