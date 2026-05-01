// pages/admin/settings.tsx
// ── Admin settings page with multiple config tabs ──

'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import Tabs from '@/components/admin-ui/Tabs';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import adminService from '@/services/adminService';
import { depositAddressService } from '@/services/depositAddressService';
import { networkFeeService } from '@/services/networkFeeService';
import { conversionService } from '@/services/conversionService';
import type { DepositAddresses, WithdrawNetwork, NetworkFees } from '@/types/funds';

const SETTINGS_KEY = ['admin', 'settings'];

export default function AdminSettingsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SettingsContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function SettingsContent() {
  const tabs = [
    { key: 'addresses', label: 'Deposit Addresses', content: <AddressesTab /> },
    { key: 'fees', label: 'Network Fees', content: <FeesTab /> },
    { key: 'conversion', label: 'Conversion Settings', content: <ConversionTab /> },
    { key: 'support', label: 'Support Settings', content: <SupportTab /> },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h2>
      <Tabs tabs={tabs} defaultTab="addresses" />
    </div>
  );
}

/* ── Deposit Addresses Tab ───────────────────────────────────────────────── */
function AddressesTab() {
  const { data, refetch } = useAdminData(
    [...SETTINGS_KEY, 'addresses'],
    () => depositAddressService.getAddresses(),
  );

  const [addresses, setAddresses] = useState<DepositAddresses>({} as DepositAddresses);

  useEffect(() => {
    if (data?.addresses) setAddresses(data.addresses);
  }, [data]);

  const updateMutation = useAdminMutation(
    (payload: Partial<DepositAddresses>) => depositAddressService.updateAddresses(payload),
    { invalidateKeys: [[...SETTINGS_KEY, 'addresses']] },
  );

  const networks: { key: WithdrawNetwork; label: string }[] = [
    { key: 'USDT-ERC20', label: 'USDT (ERC20)' },
    { key: 'USDT-TRC20', label: 'USDT (TRC20)' },
    { key: 'USDT-BEP20', label: 'USDT (BEP20)' },
    { key: 'BTC', label: 'Bitcoin (BTC)' },
    { key: 'ETH', label: 'Ethereum (ETH)' },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      {networks.map((net) => (
        <div key={net.key}>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{net.label}</label>
          <input
            type="text"
            value={addresses[net.key] || ''}
            onChange={(e) => setAddresses({ ...addresses, [net.key]: e.target.value })}
            className="w-full px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder={`Enter ${net.label} address...`}
          />
        </div>
      ))}
      <button
        onClick={() => updateMutation.mutate(addresses)}
        disabled={updateMutation.isLoading}
        className="px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
      >
        {updateMutation.isLoading ? 'Saving...' : 'Save Addresses'}
      </button>
    </div>
  );
}

/* ── Network Fees Tab ────────────────────────────────────────────────────── */
function FeesTab() {
  const { data } = useAdminData(
    [...SETTINGS_KEY, 'fees'],
    () => networkFeeService.getAllFees(),
  );

  const [fees, setFees] = useState<NetworkFees>({
    'USDT-ERC20': null,
    'USDT-TRC20': null,
    'USDT-BEP20': null,
    'BTC': null,
    'ETH': null,
  });

  useEffect(() => {
    if (data?.fees) setFees(data.fees);
  }, [data]);

  const updateMutation = useAdminMutation(
    ({ network, fee }: { network: WithdrawNetwork; fee: number }) =>
      networkFeeService.updateFee(network, fee),
    { invalidateKeys: [[...SETTINGS_KEY, 'fees']] },
  );

  const networks: { key: WithdrawNetwork; label: string }[] = [
    { key: 'USDT-ERC20', label: 'USDT (ERC20)' },
    { key: 'USDT-TRC20', label: 'USDT (TRC20)' },
    { key: 'USDT-BEP20', label: 'USDT (BEP20)' },
    { key: 'BTC', label: 'Bitcoin (BTC)' },
    { key: 'ETH', label: 'Ethereum (ETH)' },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      {networks.map((net) => (
        <div key={net.key} className="flex items-center gap-4">
          <label className="w-40 text-sm" style={{ color: 'var(--text-secondary)' }}>{net.label}</label>
          <input
            type="number"
            value={fees[net.key] ?? ''}
            onChange={(e) => setFees({ ...fees, [net.key]: parseFloat(e.target.value) || 0 })}
            className="flex-1 px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder="0.00"
            min="0"
            step="0.000001"
          />
          <button
            onClick={() => updateMutation.mutate({ network: net.key, fee: fees[net.key] ?? 0 })}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
          >
            Save
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Conversion Settings Tab ─────────────────────────────────────────────── */
function ConversionTab() {
  const { data, refetch } = useAdminData(
    [...SETTINGS_KEY, 'conversion'],
    () => adminService.getConversionConfig(),
  );

  const [config, setConfig] = useState({ feeBps: 100, minConvertUsd: 1 });

  useEffect(() => {
    if (data?.config) {
      setConfig({
        feeBps: data.config.feeBps,
        minConvertUsd: data.config.minConvertUsd,
      });
    }
  }, [data]);

  const updateMutation = useAdminMutation(
    (payload: any) => adminService.updateConversionConfig(payload),
    { invalidateKeys: [[...SETTINGS_KEY, 'conversion']] },
  );

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Fee (bps)</label>
        <input
          type="number"
          value={config.feeBps}
          onChange={(e) => setConfig({ ...config, feeBps: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Min Convert (USD)</label>
        <input
          type="number"
          value={config.minConvertUsd}
          onChange={(e) => setConfig({ ...config, minConvertUsd: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
      </div>
      <button
        onClick={() => updateMutation.mutate(config)}
        disabled={updateMutation.isLoading}
        className="px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
      >
        {updateMutation.isLoading ? 'Saving...' : 'Save Conversion Settings'}
      </button>
    </div>
  );
}

/* ── Support Settings Tab ────────────────────────────────────────────────── */
function SupportTab() {
  const { data } = useAdminData(
    [...SETTINGS_KEY, 'support'],
    () => adminService.getSupportConfig(),
  );

  const [config, setConfig] = useState({
    whatsappNumber: '',
    whatsappMessage: '',
    emailContact: '',
    ticketsEnabled: true,
    whatsappEnabled: false,
  });

  useEffect(() => {
    if (data?.config) setConfig(data.config);
  }, [data]);

  const updateMutation = useAdminMutation(
    (payload: any) => adminService.updateSupportConfig(payload),
    { invalidateKeys: [[...SETTINGS_KEY, 'support']] },
  );

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>WhatsApp Number</label>
        <input
          type="text"
          value={config.whatsappNumber}
          onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
          className="w-full px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>WhatsApp Message</label>
        <textarea
          value={config.whatsappMessage}
          onChange={(e) => setConfig({ ...config, whatsappMessage: e.target.value })}
          className="w-full px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Email Contact</label>
        <input
          type="email"
          value={config.emailContact}
          onChange={(e) => setConfig({ ...config, emailContact: e.target.value })}
          className="w-full px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="ticketsEnabled"
          checked={config.ticketsEnabled}
          onChange={(e) => setConfig({ ...config, ticketsEnabled: e.target.checked })}
        />
        <label htmlFor="ticketsEnabled" style={{ color: 'var(--text-primary)' }}>Tickets Enabled</label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="whatsappEnabled"
          checked={config.whatsappEnabled}
          onChange={(e) => setConfig({ ...config, whatsappEnabled: e.target.checked })}
        />
        <label htmlFor="whatsappEnabled" style={{ color: 'var(--text-primary)' }}>WhatsApp Enabled</label>
      </div>
      <button
        onClick={() => updateMutation.mutate(config)}
        disabled={updateMutation.isLoading}
        className="px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary)', color: 'var(--text-inverse)' }}
      >
        {updateMutation.isLoading ? 'Saving...' : 'Save Support Settings'}
      </button>
    </div>
  );
}