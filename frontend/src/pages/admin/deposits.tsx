// pages/admin/deposits.tsx
// ── Admin deposits management page ──

'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import DataTable from '@/components/admin-ui/DataTable';
import Modal from '@/components/admin-ui/Modal';
import Tabs from '@/components/admin-ui/Tabs';
import SearchInput from '@/components/admin-ui/SearchInput';
import  Badge  from '@/components/admin-ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import adminService from '@/services/adminService';
import { Deposit } from '@/types';

const DEPOSITS_KEY = ['admin', 'deposits'];

export default function DepositsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <DepositsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function DepositsContent() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);

  const { data, isLoading, refetch } = useAdminData<{ deposits: Deposit[]; total: number }>(
    [...DEPOSITS_KEY, { statusFilter, search }],
    () => adminService.fetchDeposits({ status: statusFilter || undefined, search: search || undefined }),
  );

  const approveMutation = useAdminMutation(
    (id: string) => adminService.approveDeposit(id),
    { invalidateKeys: [DEPOSITS_KEY] },
  );

  const rejectMutation = useAdminMutation(
    ({ id, reason }: { id: string; reason: string }) => adminService.rejectDeposit(id, reason),
    { invalidateKeys: [DEPOSITS_KEY] },
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
      render: (d: Deposit) => <span className="font-medium">{(d as any).userId?.email || d.userId}</span>,
    },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'network', header: 'Network' },
    { key: 'status', header: 'Status', render: (d: Deposit) => getStatusBadge(d.status) },
    {
      key: 'createdAt',
      header: 'Date',
      render: (d: Deposit) => d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d: Deposit) => (
        <button
          onClick={() => setSelectedDeposit(d)}
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
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Deposits</h2>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by user..." />
      </div>

      {/* Status tabs */}
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

      <DataTable
        columns={columns}
        data={data?.deposits || []}
        isLoading={isLoading}
        onRowClick={(d) => d.status === 'pending' && setSelectedDeposit(d)}
      />

      {/* Review Modal */}
      <ReviewDepositModal
        deposit={selectedDeposit}
        onClose={() => setSelectedDeposit(null)}
        onApprove={(id) => approveMutation.mutateAsync(id).then(() => setSelectedDeposit(null))}
        onReject={(id, reason) => rejectMutation.mutateAsync({ id, reason }).then(() => setSelectedDeposit(null))}
        isLoading={approveMutation.isLoading || rejectMutation.isLoading}
      />
    </div>
  );
}

function ReviewDepositModal({
  deposit,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: {
  deposit: Deposit | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<any>;
  onReject: (id: string, reason: string) => Promise<any>;
  isLoading: boolean;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!deposit) return null;

  return (
    <Modal isOpen={!!deposit} onClose={onClose} title="Review Deposit">
      <div className="space-y-3" style={{ color: 'var(--text-primary)' }}>
        <p><strong>User:</strong> {(deposit as any).userId?.email || deposit.userId}</p>
        <p><strong>Amount:</strong> {deposit.amount} {deposit.currency}</p>
        <p><strong>Network:</strong> {deposit.network}</p>
        <p><strong>Status:</strong> {deposit.status}</p>
        {deposit.note && <p><strong>Note:</strong> {deposit.note}</p>}
        {deposit.proofFilePath && (
          <p>
            <strong>Proof:</strong>{' '}
            <a
              href={deposit.proofFilePath}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}
            >
              View Document
            </a>
          </p>
        )}

        {deposit.status === 'pending' && (
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
                onClick={() => onApprove(deposit._id)}
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
                  onClick={() => onReject(deposit._id, rejectReason)}
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