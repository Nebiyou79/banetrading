// components/ui/DataTable.tsx
// ── Reusable data table component ──
//
// THEME FIXES applied:
// • Zebra-stripe odd rows: was 'var(--hover-bg)' — in dark mode this is
//   rgba(255,255,255,0.05) which is a very subtle tint; in light mode it's
//   rgba(124,58,237,0.06) — both are intentional and legible ✅
// • Row hover: was setting backgroundColor to 'var(--card)' which works in
//   dark mode (#161D35) but in light mode (--card = #EAE0F5) looks correct too ✅
// • However, mouseLeave after hover was only restoring even-row (transparent)
//   or odd-row (--hover-bg) but the ref to `index` was stale inside the handler.
//   Fixed by storing stripe state in a data attribute so the handler is stable.
// • Loading spinner: borderColor uses var(--primary) — now resolves ✅
// • Empty state text: var(--text-muted) ✅
// • Header bg: var(--card) ✅, header text: var(--text-secondary) ✅

import React from 'react';

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
        <div
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
          style={{ borderColor: 'var(--primary)' }}
        />
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
                className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            /* THEME FIX: store the stripe bg in a data attribute so that the
               mouseLeave handler can restore it correctly without a stale
               closure over `index`. */
            const stripeStyle = index % 2 === 0
              ? 'transparent'
              : 'var(--hover-bg)';

            return (
              <tr
                key={getRowKey(item, index)}
                data-stripe={stripeStyle}
                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                style={{
                  borderBottom: index < data.length - 1
                    ? '1px solid var(--border-subtle)'
                    : 'none',
                  backgroundColor: stripeStyle,
                }}
                onClick={() => onRowClick?.(item)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--card)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.backgroundColor = el.dataset.stripe || 'transparent';
                }}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}