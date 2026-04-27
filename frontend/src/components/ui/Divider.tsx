// components/ui/Divider.tsx
// ── Divider primitive ──

import { cn } from '../../lib/cn';

export interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps): JSX.Element {
  if (!label) {
    return <div className={cn('h-px w-full bg-border', className)} aria-hidden="true" />;
  }
  return (
    <div className={cn('flex items-center gap-3 text-xs text-text-muted', className)}>
      <div className="h-px flex-1 bg-border" />
      <span className="uppercase tracking-wider">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}