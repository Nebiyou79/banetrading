// components/ui/DataTable.tsx
// ── Reusable data table component ──

import React, { useState } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends { _id?: string; id?: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found.',
  onRowClick,
}: DataTableProps<T>) {
  const getRowKey = (item: T, index: number) => item._id || item.id || `row-${index}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
        <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-sm font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr
              key={getRowKey(item, index)}
              className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              style={{
                borderBottom: index < data.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--hover-bg)',
              }}
              onClick={() => onRowClick?.(item)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--card)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'var(--hover-bg)')}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}