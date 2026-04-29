// components/forexMetals/ForexMarketsSearch.tsx
// ── DEBOUNCED SEARCH FOR FOREX/METALS ──

import React, { useState, useEffect, useRef } from 'react';

interface ForexMarketsSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export default function ForexMarketsSearch({ value, onChange }: ForexMarketsSearchProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocal(value); }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocal(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(e.target.value), 200);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      <input type="text" value={local} onChange={handleChange} placeholder="Search by symbol or pair name..." className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-[var(--bg-muted)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-colors duration-150" />
    </div>
  );
}