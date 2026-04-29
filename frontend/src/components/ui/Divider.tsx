// components/ui/Divider.tsx
// ── Divider primitive (Binance-grade) ──

import { cn } from '../../lib/cn';

export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps): JSX.Element {
  if (!label) {
    return (
      <div
        className={cn('h-px w-full bg-[var(--border)]', className)}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 text-[10px] uppercase tracking-wide text-[var(--text-secondary)]',
        className
      )}
    >
      <div className="h-px flex-1 bg-[var(--border)]" />
      <span className="whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}