// components/ui/Tabs.tsx
'use client';

import { KeyboardEvent, ReactNode, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
  children?: (activeId: string) => ReactNode;
  ariaLabel?: string;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  className,
  children,
  ariaLabel,
}: TabsProps): JSX.Element {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(
    defaultValue ?? items[0]?.id ?? ''
  );

  const activeId = (isControlled ? value : internal) as string;

  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();

  const select = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const focusAt = (index: number) => {
    const safe = ((index % items.length) + items.length) % items.length;
    const btn = refs.current[safe];
    btn?.focus();

    const item = items[safe];
    if (item && !item.disabled) select(item.id);
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusAt(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusAt(items.length - 1);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center gap-1 p-1 overflow-x-auto',
          'rounded-button border border-[var(--border)] bg-[var(--card)]'
        )}
      >
        {items.map((item, i) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${id}-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`${id}-panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => !item.disabled && select(item.id)}
              onKeyDown={(e) => handleKey(e, i)}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap px-4 h-9 text-sm font-medium rounded-button transition-all',

                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-elevated)]',

                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        id={`${id}-panel-${activeId}`}
        aria-labelledby={`${id}-tab-${activeId}`}
      >
        {children?.(activeId)}
      </div>
    </div>
  );
}