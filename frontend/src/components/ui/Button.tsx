// components/ui/Button.tsx
// ── Button primitive ──

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-button transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
  'active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT = {
  primary:
    'bg-[var(--accent)] text-[var(--background)] hover:brightness-110',
  secondary:
    'bg-[var(--card)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--card-elevated)]',
  ghost:
    'bg-transparent text-[var(--text-primary)] hover:bg-[var(--card)]',
  danger:
    'bg-[var(--danger)] text-white hover:brightness-110',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    children,
    className,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(BASE, VARIANT[variant], SIZE[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        leadingIcon && <span className="inline-flex">{leadingIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && trailingIcon && <span className="inline-flex">{trailingIcon}</span>}
    </button>
  );
});