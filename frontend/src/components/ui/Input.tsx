// components/ui/Input.tsx
// ── Input with label, helper/error, leading/trailing slots, password toggle ──

import { forwardRef, InputHTMLAttributes, ReactNode, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/cn';

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

export interface InputProps extends BaseProps {
  label?: string;
  helper?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  showPasswordToggle?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helper,
    error,
    leading,
    trailing,
    showPasswordToggle = false,
    type = 'text',
    id,
    className,
    containerClassName,
    disabled,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPasswordToggle && revealed ? 'text' : type;

  const hasError = !!error;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'group relative flex items-center rounded-input border bg-muted transition-colors',
          hasError
            ? 'border-danger focus-within:border-danger'
            : 'border-border focus-within:border-accent',
          disabled && 'opacity-60',
        )}
      >
        {leading && (
          <span className="pl-3 pr-1 text-text-muted inline-flex items-center">{leading}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : helper ? helperId : undefined}
          className={cn(
            'h-11 w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none',
            leading && 'pl-2',
            (trailing || (isPassword && showPasswordToggle)) && 'pr-2',
            className,
          )}
          {...rest}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            className="pr-3 pl-1 inline-flex items-center text-text-muted hover:text-text-primary transition-colors"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {!isPassword && trailing && (
          <span className="pr-3 pl-1 inline-flex items-center text-text-muted">{trailing}</span>
        )}
      </div>
      {hasError ? (
        <p id={errorId} className="text-xs text-danger">{error}</p>
      ) : helper ? (
        <p id={helperId} className="text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
});