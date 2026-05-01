// pages/admin/users.tsx
// ── Admin user management page ──

'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import DataTable from '@/components/admin-ui/DataTable';
import Modal from '@/components/admin-ui/Modal';
import SearchInput from '@/components/admin-ui/SearchInput';
import Badge from '@/components/admin-ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import adminService from '@/services/adminService';
import type { User } from '@/types';

const USERS_KEY = ['admin', 'users'];

export default function UsersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <UsersContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function UsersContent() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useAdminData<{ users: User[]; total: number }>(
    [...USERS_KEY, { search, sortBy, page }],
    () => adminService.fetchUsers({ search, sortBy, skip: page * 20, limit: 20 }),
  );

  const updateMutation = useAdminMutation(
    (payload: { id: string; data: Partial<User> }) => adminService.updateUser(payload.id, payload.data),
    { invalidateKeys: [USERS_KEY] },
  );

  const deleteMutation = useAdminMutation(
    (id: string) => adminService.deleteUser(id),
    { invalidateKeys: [USERS_KEY] },
  );

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u: User) => <span className="font-medium">{u.name}</span>,
    },
    { key: 'email', header: 'Email' },
    {
      key: 'balance',
      header: 'Balance (USDT)',
      render: (u: User) => <span className="tabular" data-numeric>{(u.balance || 0).toFixed(2)}</span>,
    },
    { key: 'kycTier', header: 'KYC Tier' },
    {
      key: 'isFrozen',
      header: 'Status',
      render: (u: User) => (
        <Badge variant={u.isFrozen ? 'danger' : 'success'}>
          {u.isFrozen ? 'Frozen' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u: User) => u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u: User) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingUser(u)}
            className="px-3 py-1 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--info-muted)', color: 'var(--info)' }}
          >
            Edit
          </button>
          <button
            onClick={() => setDeletingUser(u)}
            className="px-3 py-1 rounded text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--danger-muted)', color: 'var(--danger)' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Users</h2>
        <div className="flex gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="balanceDesc">Highest Balance</option>
            <option value="balanceAsc">Lowest Balance</option>
            <option value="nameAsc">Name A-Z</option>
            <option value="nameDesc">Name Z-A</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={data?.users || []} isLoading={isLoading} />

      {/* Pagination */}
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

      {/* Edit Modal */}
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(id, data) => updateMutation.mutateAsync({ id, data }).then(() => setEditingUser(null))}
        isLoading={updateMutation.isLoading}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingUser} onClose={() => setDeletingUser(null)} title="Delete User" size="sm">
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete user <strong>{deletingUser?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeletingUser(null)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => deletingUser && deleteMutation.mutateAsync(deletingUser._id).then(() => setDeletingUser(null))}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--danger)', color: 'white' }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function EditUserModal({
  user,
  onClose,
  onSave,
  isLoading,
}: {
  user: User | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<User>) => Promise<any>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<User>>({});

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        kycTier: user.kycTier,
        isFrozen: user.isFrozen,
        autoMode: user.autoMode || 'off',
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <Modal isOpen={!!user} onClose={onClose} title={`Edit User: ${user.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>KYC Tier</label>
          <select
            value={formData.kycTier || 1}
            onChange={(e) => setFormData({ ...formData, kycTier: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Auto Mode</label>
          <select
            value={String(formData.autoMode ?? 'off')}
            onChange={(e) => setFormData({ ...formData, autoMode: e.target.value as any })}
            className="w-full px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <option value="off">Off</option>
            <option value="random">Random</option>
            <option value="alwaysWin">Always Win</option>
            <option value="alwaysLose">Always Lose</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFrozen"
            checked={formData.isFrozen || false}
            onChange={(e) => setFormData({ ...formData, isFrozen: e.target.checked })}
          />
          <label htmlFor="isFrozen" style={{ color: 'var(--text-primary)' }}>Freeze Account</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(user._id, formData)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}