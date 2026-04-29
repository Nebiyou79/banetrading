// components/markets/MarketsSearch.tsx
// ── DEBOUNCED SEARCH INPUT ──

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface MarketsSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarketsSearch({
  value: externalValue,
  onChange,
  placeholder = 'Search by name or symbol...',
}: MarketsSearchProps) {
  const [localValue, setLocalValue] = useState(externalValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync external changes ──
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(next);
    }, 200);
  };

  // ── Cleanup debounce on unmount ──
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* ── Search icon ── */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-4 py-2.5 rounded-lg text-sm
          bg-[var(--bg-muted)] text-[var(--text-primary)]
          placeholder:text-[var(--text-muted)]
          border border-[var(--border)]
          focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent
          transition-colors duration-150
        `}
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue('');
            onChange('');
            if (debounceRef.current) clearTimeout(debounceRef.current);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}