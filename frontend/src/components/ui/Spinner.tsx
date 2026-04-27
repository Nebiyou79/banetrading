// components/ui/Spinner.tsx
// ── Loading spinner (3 sizes) ──

import { cn } from '../../lib/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-[3px]',
};

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps): JSX.Element {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent',
        SIZE[size],
        className,
      )}
    />
  );
}