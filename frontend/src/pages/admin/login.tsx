// components/ui/SearchInput.tsx
// ── Themed search input with debounce ──

import React, { useState, useEffect } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export default function SearchInput({ placeholder = 'Search...', value = '', onChange, debounceMs = 300 }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          '--tw-ring-color': 'var(--focus-ring)',
        } as React.CSSProperties}
      />
    </div>
  );
}