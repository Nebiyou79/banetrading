// pages/admin/users.tsx
// ── Admin user management page ──
//
// BALANCE FIX (original):
// Balance column now reads u.balances?.USDT (the multi-asset map) with a
// fallback to u.balance (legacy scalar) for existing records.
//
// THEME FIXES applied:
// • Edit/Delete action buttons: already use --info-muted/--danger-muted ✅
// • "Save Changes" button in EditUserModal: color was implicit white → var(--text-inverse)
// • "Delete" button in delete confirm modal: color was hardcoded 'white' → var(--text-inverse)
// • "Cancel" buttons in both modals: color was implicit → already var(--text-primary) ✅
// • All <select> dropdowns: focus ring via onFocus/onBlur; appearance:none in globals.css
//   ensures backgroundColor renders in both themes
// • All <input> fields in EditUserModal: focus ring via onFocus/onBlur
// • Sort <select> in toolbar: same focus ring fix
// • Pagination buttons: already use var(--card)/var(--text-primary) ✅
// • Checkbox in EditUserModal: accentColor: var(--primary) for themed tick mark

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

/* ── Shared focus handlers ────────────────────────────────────────────────── */
const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--focus-ring)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border)';
  },
};

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

  const { data, isLoading } = useAdminData<{ users: User[]; total: number }>(
    [...USERS_KEY, { search, sortBy, page }],
    () => adminService.fetchUsers({ search, sortBy, skip: page * 20, limit: 20 }),
  );

  const updateMutation = useAdminMutation(
    (payload: { id: string; data: Partial<User> }) =>
      adminService.updateUser(payload.id, payload.data),
    { invalidateKeys: [USERS_KEY] },
  );

  const balanceMutation = useAdminMutation(
    (payload: { id: string; currency: string; resolvedAmount: number }) =>
      adminService.updateUserBalance(payload.id, {
        currency: payload.currency,
        resolvedAmount: payload.resolvedAmount,
      }),
    { invalidateKeys: [USERS_KEY] },
  );

  const deleteMutation = useAdminMutation(
    (id: string) => adminService.deleteUser(id),
    { invalidateKeys: [USERS_KEY] },
  );

  const getUsdtBalance = (u: User): number => {
    if (u.balances && typeof u.balances === 'object') {
      return Number((u.balances as any).USDT ?? u.balance ?? 0);
    }
    return Number(u.balance ?? 0);
  };

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
      render: (u: User) => (
        <span className="tabular" data-numeric>
          {getUsdtBalance(u).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'lockedBalance',
      header: 'Locked (USDT)',
      render: (u: User) => {
        const locked = Number((u as any).lockedBalances?.USDT ?? 0);
        return (
          <span
            className="tabular"
            data-numeric
            style={{ color: locked > 0 ? 'var(--warning)' : 'var(--text-muted)' }}
          >
            {locked.toFixed(2)}
          </span>
        );
      },
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
            className="px-3 py-1 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--info-muted)', color: 'var(--info)' }}
          >
            Edit
          </button>
          <button
            onClick={() => setDeletingUser(u)}
            className="px-3 py-1 rounded text-sm font-medium transition-opacity hover:opacity-80"
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
          {/* THEME FIX: appearance:none in globals.css; focus ring via handlers */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              outline: 'none',
            }}
            {...focusHandlers}
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
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page {page + 1} of {Math.ceil(data.total / 20)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * 20 >= data.total}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            Next
          </button>
        </div>
      )}

      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(id, data) =>
          updateMutation.mutateAsync({ id, data }).then(() => setEditingUser(null))
        }
        onUpdateBalance={(id, currency, resolvedAmount) =>
          balanceMutation.mutateAsync({ id, currency, resolvedAmount })
        }
        isLoading={updateMutation.isLoading}
        isBalanceLoading={balanceMutation.isLoading}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Delete User"
        size="sm"
      >
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete user <strong style={{ color: 'var(--text-primary)' }}>{deletingUser?.name}</strong>?{' '}
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeletingUser(null)}
            className="px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              deletingUser &&
              deleteMutation.mutateAsync(deletingUser._id).then(() => setDeletingUser(null))
            }
            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--danger)',
              /* THEME FIX: was hardcoded 'white' → var(--text-inverse) */
              color: 'var(--text-inverse)',
            }}
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
  onUpdateBalance,
  isLoading,
  isBalanceLoading,
}: {
  user: User | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<User>) => Promise<any>;
  onUpdateBalance: (id: string, currency: string, resolvedAmount: number) => Promise<any>;
  isLoading: boolean;
  isBalanceLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceCurrency, setBalanceCurrency] = useState('USDT');
  const [balanceMode, setBalanceMode] = useState<'set' | 'add' | 'subtract'>('set');
  const [balanceSuccess, setBalanceSuccess] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        kycTier: user.kycTier,
        isFrozen: user.isFrozen,
        autoMode: user.autoMode || 'off',
      });
      setBalanceAmount('');
      setBalanceMode('set');
      setBalanceSuccess(false);
    }
  }, [user]);

  if (!user) return null;

  const inputStyle = {
    backgroundColor: 'var(--card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    outline: 'none',
  };

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
            style={inputStyle}
            {...focusHandlers}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg"
            style={inputStyle}
            {...focusHandlers}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>KYC Tier</label>
          {/* THEME FIX: appearance:none in globals.css; focus ring via handlers */}
          <select
            value={formData.kycTier || 1}
            onChange={(e) => setFormData({ ...formData, kycTier: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg"
            style={inputStyle}
            {...focusHandlers}
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
            style={inputStyle}
            {...focusHandlers}
          >
            <option value="off">Off</option>
            <option value="random">Random</option>
            <option value="alwaysWin">Always Win</option>
            <option value="alwaysLose">Always Lose</option>
          </select>
        </div>

        {/* THEME FIX: accentColor matches theme primary for checkbox tick */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFrozen"
            checked={formData.isFrozen || false}
            onChange={(e) => setFormData({ ...formData, isFrozen: e.target.checked })}
            style={{ accentColor: 'var(--primary)', width: '1rem', height: '1rem' }}
          />
          <label htmlFor="isFrozen" style={{ color: 'var(--text-primary)' }}>
            Freeze Account
          </label>
        </div>

        {/* ── Balance Update ──────────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
            marginTop: '0.5rem',
          }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Update Balance
          </p>
          <div className="flex gap-2 mb-2">
            {/* Currency */}
            <select
              value={balanceCurrency}
              onChange={(e) => setBalanceCurrency(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ ...inputStyle, width: '6rem', flexShrink: 0 }}
              {...focusHandlers}
            >
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
            {/* Mode */}
            <select
              value={balanceMode}
              onChange={(e) => setBalanceMode(e.target.value as 'set' | 'add' | 'subtract')}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ ...inputStyle, width: '7.5rem', flexShrink: 0 }}
              {...focusHandlers}
            >
              <option value="set">Set to</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
            {/* Amount */}
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={balanceAmount}
              onChange={(e) => { setBalanceAmount(e.target.value); setBalanceSuccess(false); }}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={inputStyle}
              {...focusHandlers}
            />
            {/* Apply */}
            <button
              onClick={async () => {
                const amount = parseFloat(balanceAmount);
                if (isNaN(amount) || amount < 0) return;
                // Resolve the final "set" value from the selected mode + current balance
                const currentBal = Number(
                  (user.balances as any)?.[balanceCurrency] ?? 0
                );
                let resolved: number;
                if (balanceMode === 'set')      resolved = amount;
                else if (balanceMode === 'add') resolved = Math.max(0, currentBal + amount);
                else                            resolved = Math.max(0, currentBal - amount);
                await onUpdateBalance(user._id, balanceCurrency, resolved);
                setBalanceSuccess(true);
                setBalanceAmount('');
              }}
              disabled={isBalanceLoading || !balanceAmount}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)', flexShrink: 0 }}
            >
              {isBalanceLoading ? '...' : 'Apply'}
            </button>
          </div>
          {balanceSuccess && (
            <p className="text-xs" style={{ color: 'var(--success)' }}>
              ✓ Balance updated successfully
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(user._id, formData)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--primary)',
              /* THEME FIX: was implicit white → var(--text-inverse) */
              color: 'var(--text-inverse)',
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}