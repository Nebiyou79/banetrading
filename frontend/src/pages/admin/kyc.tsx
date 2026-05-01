// pages/admin/kyc.tsx
// ── Admin KYC management page ──

'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import DataTable from '@/components/admin-ui/DataTable';
import Modal from '@/components/admin-ui/Modal';
import Tabs from '@/components/admin-ui/Tabs';
import SearchInput from '@/components/admin-ui/SearchInput';
import Badge from '@/components/admin-ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import adminService from '@/services/adminService';

const KYC_KEY = ['admin', 'kyc'];

interface KycSubmission {
  _id: string;
  userId: { _id: string; email: string; name: string; displayName?: string; kycTier: number };
  level2: any;
  level3: any;
  updatedAt: string;
}

export default function KycPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <KycContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function KycContent() {
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);
  const [activeLevel, setActiveLevel] = useState(2);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminData<{ items: KycSubmission[]; total: number }>(
    [...KYC_KEY, { level: activeLevel, search }],
    () => adminService.fetchKycList({ level: activeLevel, search }),
  );

  const approveMutation = useAdminMutation(
    ({ userId, level }: { userId: string; level: number }) => adminService.approveKyc(userId, level),
    { invalidateKeys: [KYC_KEY] },
  );

  const rejectMutation = useAdminMutation(
    ({ userId, level, reason }: { userId: string; level: number; reason: string }) =>
      adminService.rejectKyc(userId, level, reason),
    { invalidateKeys: [KYC_KEY] },
  );

  const columns = [
    {
      key: 'userId',
      header: 'User',
      render: (k: KycSubmission) => <span className="font-medium">{k.userId?.email || 'Unknown'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (k: KycSubmission) => {
        const status = activeLevel === 2 ? k.level2?.status : k.level3?.status;
        return <Badge variant={status === 'pending' ? 'warning' : 'neutral'}>{status || 'unknown'}</Badge>;
      },
    },
    {
      key: 'updatedAt',
      header: 'Submitted',
      render: (k: KycSubmission) => k.updatedAt ? new Date(k.updatedAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (k: KycSubmission) => (
        <button
          onClick={() => setSelectedKyc(k)}
          className="px-3 py-1 rounded text-sm font-medium"
          style={{ backgroundColor: 'var(--info-muted)', color: 'var(--info)' }}
        >
          Review
        </button>
      ),
    },
  ];

  const tabs = [
    {
      key: '2',
      label: 'Level 2 Requests',
      content: <DataTable columns={columns} data={data?.items || []} isLoading={isLoading} />,
    },
    {
      key: '3',
      label: 'Level 3 Requests',
      content: <DataTable columns={columns} data={data?.items || []} isLoading={isLoading} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>KYC Management</h2>
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
      </div>

      <Tabs
        tabs={tabs}
        defaultTab="2"
        onChange={(key) => setActiveLevel(parseInt(key))}
      />

      {/* KYC Review Modal */}
      <KycReviewModal
        submission={selectedKyc}
        level={activeLevel}
        onClose={() => setSelectedKyc(null)}
        onApprove={(userId) =>
          approveMutation.mutateAsync({ userId, level: activeLevel }).then(() => setSelectedKyc(null))
        }
        onReject={(userId, reason) =>
          rejectMutation.mutateAsync({ userId, level: activeLevel, reason }).then(() => setSelectedKyc(null))
        }
        isLoading={approveMutation.isLoading || rejectMutation.isLoading}
      />
    </div>
  );
}

function KycReviewModal({
  submission,
  level,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: {
  submission: KycSubmission | null;
  level: number;
  onClose: () => void;
  onApprove: (userId: string) => Promise<any>;
  onReject: (userId: string, reason: string) => Promise<any>;
  isLoading: boolean;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!submission) return null;
  const data = level === 2 ? submission.level2 : submission.level3;

  return (
    <Modal isOpen={!!submission} onClose={onClose} title={`Review KYC Level ${level}`} size="lg">
      <div className="space-y-3" style={{ color: 'var(--text-primary)' }}>
        <p><strong>User:</strong> {submission.userId?.email}</p>
        {data?.fullName && <p><strong>Full Name:</strong> {data.fullName}</p>}
        {data?.dateOfBirth && <p><strong>DOB:</strong> {new Date(data.dateOfBirth).toLocaleDateString()}</p>}
        {data?.country && <p><strong>Country:</strong> {data.country}</p>}

        {level === 2 && (
          <>
            {data?.idType && <p><strong>ID Type:</strong> {data.idType}</p>}
            {data?.idNumber && <p><strong>ID Number:</strong> {data.idNumber}</p>}
            {data?.expiryDate && <p><strong>Expiry:</strong> {new Date(data.expiryDate).toLocaleDateString()}</p>}
            {data?.idFrontPath && (
              <p><strong>ID Front:</strong> <a href={data.idFrontPath} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a></p>
            )}
            {data?.idBackPath && (
              <p><strong>ID Back:</strong> <a href={data.idBackPath} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a></p>
            )}
            {data?.selfiePath && (
              <p><strong>Selfie:</strong> <a href={data.selfiePath} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a></p>
            )}
          </>
        )}

        {level === 3 && (
          <>
            {data?.addressLine && <p><strong>Address:</strong> {data.addressLine}</p>}
            {data?.city && <p><strong>City:</strong> {data.city}</p>}
            {data?.postalCode && <p><strong>Postal Code:</strong> {data.postalCode}</p>}
            {data?.documentPath && (
              <p><strong>Document:</strong> <a href={data.documentPath} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View</a></p>
            )}
          </>
        )}

        {data?.status === 'pending' && (
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
                onClick={() => onApprove(submission.userId._id)}
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
                  onClick={() => onReject(submission.userId._id, rejectReason)}
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