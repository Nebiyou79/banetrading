// components/ui/Select.tsx

import {
  KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
  searchable?: boolean;
  id?: string;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
  helper,
  disabled,
  searchable = true,
  id,
  className,
}: SelectProps) {
  const autoId = useId();
  const fieldId = id || autoId;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, options]);

  useEffect(() => {
    if (!open) return;

    const close = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (opt: SelectOption) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'h-11 w-full flex items-center justify-between px-3 rounded-input border',
            'bg-[var(--card)] text-sm',
            error
              ? 'border-[var(--danger)]'
              : 'border-[var(--border)] hover:border-[var(--text-muted)]'
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-card border border-[var(--border)] bg-[var(--card)] shadow-card">
            {searchable && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
                <Search className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            )}

            <ul className="max-h-60 overflow-auto">
              {filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  onClick={() => pick(opt)}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer flex justify-between',
                    i === highlight && 'bg-[var(--card-elevated)]'
                  )}
                >
                  {opt.label}
                  {value === opt.value && (
                    <Check className="h-4 w-4 text-[var(--accent)]" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : helper ? (
        <p className="text-xs text-[var(--text-muted)]">{helper}</p>
      ) : null}
    </div>
  );
}