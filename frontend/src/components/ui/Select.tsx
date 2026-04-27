// components/ui/Select.tsx
// ── Searchable select (for country dropdown) ──

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
}: SelectProps): JSX.Element {
  const autoId = useId();
  const fieldId = id || autoId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent): void => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setHighlight(0);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 10);
    }
  }, [open, searchable]);

  const pick = (opt: SelectOption): void => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
    setHighlight(0);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return;
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); setQuery(''); setHighlight(0); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return; }
      if (e.key === 'Enter')     {
        e.preventDefault();
        const opt = filtered[highlight];
        if (opt) pick(opt);
      }
    }
  };

  const hasError = !!error;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-text-secondary">{label}</label>
      )}
      <div
        ref={containerRef}
        className="relative"
        onKeyDown={onKey}
      >
        <button
          id={fieldId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={hasError || undefined}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-input border bg-muted px-3 text-sm transition-colors',
            hasError ? 'border-danger focus:border-danger' : 'border-border hover:border-text-muted focus:border-accent',
            'focus:outline-none',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
        >
          <span className={cn('truncate', selected ? 'text-text-primary' : 'text-text-muted')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded-card border border-border bg-elevated shadow-card"
          >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 text-text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
                  placeholder="Search…"
                  className="h-7 w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
              </div>
            )}
            <ul className="max-h-60 overflow-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-text-muted">No results</li>
              )}
              {filtered.map((opt, i) => {
                const isActive = opt.value === value;
                const isHighlight = i === highlight;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                      isHighlight ? 'bg-muted text-text-primary' : 'text-text-secondary',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && <Check className="h-4 w-4 text-accent" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      {hasError ? (
        <p className="text-xs text-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
}