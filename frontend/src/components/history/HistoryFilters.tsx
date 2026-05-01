// components/history/HistoryFilters.tsx
// ── HISTORY FILTERS ──

import React from 'react';
import type { HistoryItemType } from '@/types/history';

interface HistoryFiltersProps {
  type: HistoryItemType | 'all';
  status: string;
  from: string;
  to: string;
  onStatusChange: (status: string) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Record<string, string[]> = {
  all:      ['all', 'completed', 'pending', 'failed'],
  trade:    ['all', 'completed', 'failed'],
  deposit:  ['all', 'pending', 'approved', 'rejected'],
  withdrawal: ['all', 'pending', 'approved', 'rejected'],
  conversion: ['all', 'completed', 'failed'],
};

export default function HistoryFilters({
  type, status, from, to,
  onStatusChange, onFromChange, onToChange, onReset,
}: HistoryFiltersProps) {
  const options = STATUS_OPTIONS[type] || STATUS_OPTIONS.all;
  const hasFilters = status || from || to;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* ── From date ── */}
      <input
        type="date"
        value={from}
        onChange={e => onFromChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        aria-label="From date"
      />

      {/* ── To date ── */}
      <input
        type="date"
        value={to}
        onChange={e => onToChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        aria-label="To date"
      />

      {/* ── Status ── */}
      <select
        value={status}
        onChange={e => onStatusChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
        aria-label="Status filter"
      >
        {options.map(opt => (
          <option key={opt} value={opt === 'all' ? '' : opt}>
            {opt === 'all' ? 'All Statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>

      {/* ── Reset ── */}
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] border border-[var(--border)] transition-colors duration-150"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}