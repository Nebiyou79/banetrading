// components/ui/Select.tsx
// Portal-based searchable select — fixes dropdown invisibility caused by
// ancestor overflow:hidden (common in AuthLayout card containers).

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

// ─── Dropdown rendered via portal so it escapes overflow:hidden parents ───────
interface DropdownPortalProps {
  options: SelectOption[];
  selected: string;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (value: string) => void;
  anchorRect: DOMRect | null;
  searchable: boolean;
}

function DropdownPortal({
  options,
  selected,
  query,
  onQueryChange,
  onSelect,
  anchorRect,
  searchable,
}: DropdownPortalProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const MAX_HEIGHT = 264;

  // Focus search input on mount
  useEffect(() => {
    if (searchable) searchRef.current?.focus();
  }, [searchable]);

  if (!anchorRect) return null;

  // Decide whether to open upward or downward
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < MAX_HEIGHT && anchorRect.top > MAX_HEIGHT;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: anchorRect.left,
    width: anchorRect.width,
    zIndex: 9999,
    background: 'var(--background, #0f1117)',
    border: '1px solid var(--border, rgba(255,255,255,0.12))',
    borderRadius: '0.5rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: MAX_HEIGHT,
    ...(openUpward
      ? { bottom: window.innerHeight - anchorRect.top + 4 }
      : { top: anchorRect.bottom + 4 }),
  };

  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return createPortal(
    <div style={style} role="listbox">
      {searchable && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          }}
        >
          <Search
            style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }}
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onQueryChange(e.target.value)
            }
            placeholder="Search…"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              width: '100%',
              color: 'var(--text-primary, #e2e8f0)',
            }}
          />
        </div>
      )}

      <ul
        role="listbox"
        style={{ overflowY: 'auto', margin: 0, padding: '4px 0', listStyle: 'none' }}
      >
        {filtered.length === 0 ? (
          <li
            style={{
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            No results found
          </li>
        ) : (
          filtered.map((opt) => {
            const isSelected = opt.value === selected;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(opt.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: isSelected
                    ? 'var(--page-accent, #2dd4bf)'
                    : 'var(--text-primary, #e2e8f0)',
                  background: isSelected
                    ? 'var(--page-accent-muted, rgba(45,212,191,0.08))'
                    : 'transparent',
                  fontWeight: isSelected ? 500 : 400,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.background =
                      'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check style={{ width: 14, height: 14, flexShrink: 0 }} />
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>,
    document.body
  );
}

// ─── Main Select component ────────────────────────────────────────────────────
export function Select({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
  searchable = false,
  disabled = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const openDropdown = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect() ?? null;
    setAnchorRect(rect);
    setQuery('');
    setOpen(true);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      closeDropdown();
      triggerRef.current?.focus();
    },
    [onChange, closeDropdown]
  );

  // Close on outside click / scroll
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) === false &&
        !(e.target as HTMLElement).closest('[role="listbox"]')
      ) {
        closeDropdown();
      }
    };

    const onScroll = () => {
      if (triggerRef.current) {
        setAnchorRect(triggerRef.current.getBoundingClientRect());
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, closeDropdown]);

  // Keyboard: Escape closes, Enter/Space opens
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') closeDropdown();
    if ((e.key === 'Enter' || e.key === ' ') && !open) {
      e.preventDefault();
      openDropdown();
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 40,
          padding: '0 12px',
          border: `1px solid ${
            error
              ? 'var(--danger, #ef4444)'
              : open
              ? 'var(--page-accent, #2dd4bf)'
              : 'var(--border, rgba(255,255,255,0.12))'
          }`,
          borderRadius: '0.5rem',
          background: 'var(--input-bg, rgba(255,255,255,0.04))',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          boxShadow: open ? '0 0 0 2px var(--page-accent-muted, rgba(45,212,191,0.18))' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedLabel
              ? 'var(--text-primary, #e2e8f0)'
              : 'var(--text-muted, #64748b)',
          }}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </div>

      {open && (
        <DropdownPortal
          options={options}
          selected={value}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
          anchorRect={anchorRect}
          searchable={searchable}
        />
      )}
    </>
  );
}